import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { addDays, parseISO, differenceInDays, startOfDay } from 'date-fns';
import { getBookingWithDetails } from '@/lib/bookings';
import { notifyTripReminder, notifyInvitationsExpiring } from '@/lib/email/notifications';
import { wasNotificationSent } from '@/lib/email/send';
import { formatDate } from '@/lib/dates';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const today = startOfDay(new Date());

  // Trip reminders
  const { data: approvedBookings } = await admin
    .from('bookings')
    .select('id')
    .eq('status', 'approved');

  for (const { id } of approvedBookings ?? []) {
    const booking = await getBookingWithDetails(id);
    if (!booking?.dates) continue;

    const checkIn = parseISO(booking.dates.check_in);
    const daysUntil = differenceInDays(checkIn, today);

    if (daysUntil === 7) {
      const sent = await wasNotificationSent(id, 'reminder_7d');
      if (!sent) await notifyTripReminder(booking, 7);
    } else if (daysUntil === 1) {
      const sent = await wasNotificationSent(id, 'reminder_1d');
      if (!sent) await notifyTripReminder(booking, 1);
    }
  }

  // Invitation expiring in 48h
  const in48h = addDays(new Date(), 2);
  const { data: expiring } = await admin
    .from('invitations')
    .select('*, property:properties(name, owner_id, owner:users!owner_id(email, name))')
    .eq('status', 'pending')
    .not('expires_at', 'is', null)
    .lte('expires_at', in48h.toISOString())
    .gte('expires_at', new Date().toISOString());

  const byOwner = new Map<
    string,
    { email: string; name: string; invitations: { guestName: string; propertyName: string; expiresAt: string }[] }
  >();

  for (const inv of expiring ?? []) {
    const owner = inv.property?.owner as { email: string; name: string | null };
    if (!owner) continue;
    const key = owner.email;
    if (!byOwner.has(key)) {
      byOwner.set(key, {
        email: owner.email,
        name: owner.name ?? 'there',
        invitations: [],
      });
    }
    byOwner.get(key)!.invitations.push({
      guestName: inv.guest_name ?? inv.guest_email,
      propertyName: inv.property.name,
      expiresAt: formatDate(inv.expires_at),
    });
  }

  for (const owner of Array.from(byOwner.values())) {
    await notifyInvitationsExpiring(
      owner.email,
      owner.name,
      owner.invitations
    );
  }

  return NextResponse.json({
    ok: true,
    processed: approvedBookings?.length ?? 0,
    expiring: expiring?.length ?? 0,
  });
}
