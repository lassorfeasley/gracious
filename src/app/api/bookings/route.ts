import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { bookingRequestSchema } from '@/lib/validations';
import { getInvitationByToken, isInvitationActive } from '@/lib/invitations';
import {
  checkRoomConflicts,
  validateBookingAgainstInvitation,
} from '@/lib/bookings';
import { notifyStayRequested } from '@/lib/email/notifications';
import { upsertUserProfile } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bookingRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const invitation = await getInvitationByToken(data.invitation_token);
    if (!invitation || !isInvitationActive(invitation)) {
      return NextResponse.json({ error: 'Invalid or expired invitation' }, { status: 400 });
    }

    const validation = validateBookingAgainstInvitation(
      invitation,
      data.check_in,
      data.check_out,
      data.room_ids,
      data.party_size
    );
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const conflicts = await checkRoomConflicts(
      data.room_ids,
      data.check_in,
      data.check_out
    );
    if (conflicts.hasConflict) {
      return NextResponse.json(
        { error: 'Selected dates conflict with an existing booking or block' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    if (authUser.email !== invitation.guest_email) {
      return NextResponse.json(
        { error: 'This invitation was sent to a different email address' },
        { status: 403 }
      );
    }

    await upsertUserProfile(
      authUser.id,
      authUser.email!,
      'guest',
      data.guest_name
    );

    if (data.guest_name) {
      await createAdminClient()
        .from('users')
        .update({ name: data.guest_name })
        .eq('id', authUser.id);
    }

    const admin = createAdminClient();

    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .insert({
        invitation_id: invitation.id,
        property_id: invitation.property_id,
        guest_user_id: authUser.id,
        status: 'requested',
        party_size: data.party_size,
        notes: data.notes ?? null,
        notify_guest: true,
      })
      .select()
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: bookingError?.message }, { status: 500 });
    }

    await admin.from('booking_dates').insert({
      booking_id: booking.id,
      check_in: data.check_in,
      check_out: data.check_out,
    });

    await admin.from('booking_rooms').insert(
      data.room_ids.map((room_id) => ({
        booking_id: booking.id,
        room_id,
      }))
    );

    await admin
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitation.id)
      .eq('status', 'pending');

    notifyStayRequested(booking.id).catch(console.error);

    return NextResponse.json({ booking });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
