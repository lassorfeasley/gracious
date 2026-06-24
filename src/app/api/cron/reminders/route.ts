import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { addDays, parseISO, differenceInCalendarDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { getVisitWithDetails } from '@/lib/visits';
import {
  notifyVisitReminder,
  notifyArrivalWelcome,
  notifyCheckoutInstructions,
  notifyPostVisit,
  notifyInvitationsExpiring,
  notifyInviteReminder,
  notifyInviteStalled,
} from '@/lib/email/notifications';
import {
  wasNotificationSent,
  wasInvitationNotificationSent,
} from '@/lib/email/send';
import { drainEmailOutbox } from '@/lib/email/outbox';
import { formatDate } from '@/lib/dates';
import { inviteUrl } from '@/lib/invitations';
import { wantsEmail } from '@/lib/notification-prefs';
import {
  dueInviteReminderStep,
  isInviteStalledByAge,
  INVITE_HOST_NUDGE_LOG_TYPE,
} from '@/lib/invite-reminders';
import type { NotificationPrefs } from '@/types/database';

// Fallback timezone for properties that haven't set one.
const DEFAULT_TIMEZONE = 'America/Denver';
// Local hour (24h) at which time-of-day emails go out.
const SEND_HOUR = 8;
// UTC hour at which once-daily host digests are sent (kept stable even though
// the cron now runs hourly).
const DIGEST_UTC_HOUR = 9;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = new Date();

  // Lifecycle emails — evaluated per visit against the property's local time
  // so each one lands in the guest's morning, not a fixed UTC hour.
  const { data: approvedVisits } = await admin
    .from('visits')
    .select('id')
    .eq('status', 'approved');

  let lifecycleSends = 0;

  for (const { id } of approvedVisits ?? []) {
    const visit = await getVisitWithDetails(id);
    if (!visit?.dates) continue;

    const tz = visit.property.timezone || DEFAULT_TIMEZONE;
    const localHour = Number(formatInTimeZone(now, tz, 'H'));
    // Only act during the property's local send hour. Combined with the
    // notifications_log dedup, this means at most one send per visit per day.
    if (localHour !== SEND_HOUR) continue;

    const localToday = formatInTimeZone(now, tz, 'yyyy-MM-dd');
    const today = parseISO(localToday);
    const checkIn = parseISO(visit.dates.check_in);
    const checkOut = parseISO(visit.dates.check_out);

    const daysUntilCheckIn = differenceInCalendarDays(checkIn, today);
    const daysSinceCheckOut = differenceInCalendarDays(today, checkOut);

    if (daysUntilCheckIn === 7) {
      if (!(await wasNotificationSent(id, 'reminder_7d'))) {
        await notifyVisitReminder(visit, 7);
        lifecycleSends++;
      }
    } else if (daysUntilCheckIn === 1) {
      if (!(await wasNotificationSent(id, 'reminder_1d'))) {
        await notifyVisitReminder(visit, 1);
        lifecycleSends++;
      }
    } else if (daysUntilCheckIn === 0) {
      // Morning of arrival: welcome + how to get in.
      if (!(await wasNotificationSent(id, 'arrival_welcome'))) {
        await notifyArrivalWelcome(visit);
        lifecycleSends++;
      }
    }

    // Morning of departure: send checkout instructions.
    if (daysSinceCheckOut === 0) {
      if (!(await wasNotificationSent(id, 'checkout_instructions'))) {
        await notifyCheckoutInstructions(visit);
        lifecycleSends++;
      }
    }

    // Morning after departure: send the post-visit thank-you.
    if (daysSinceCheckOut === 1) {
      if (!(await wasNotificationSent(id, 'post_visit'))) {
        await notifyPostVisit(visit);
        lifecycleSends++;
      }
    }
  }

  // Invite reminder drip — nudge guests who haven't responded yet, once per day
  // on days 1/2/3 after the invite was sent. Stops the moment the invitation
  // leaves `pending` (booked/requested/revoked) or expires. Deduped per step via
  // notifications_log, so running more than once a day is safe. The final nudge
  // (day 3) is the last guest touch; day 4+ escalates to the host below.
  const nowIso = now.toISOString();
  const { data: pendingInvites } = await admin
    .from('invitations')
    .select('id, created_at, expires_at')
    .eq('status', 'pending')
    .or(`expires_at.is.null,expires_at.gt.${nowIso}`);

  let inviteReminderSends = 0;
  let inviteStalled = 0;

  for (const inv of pendingInvites ?? []) {
    const step = dueInviteReminderStep(inv.created_at, now);
    if (step === null) continue;
    if (await wasInvitationNotificationSent(inv.id, `invite_reminder_${step}`))
      continue;
    await notifyInviteReminder(inv.id, step);
    inviteReminderSends++;
  }

  // Stalled-invite host nudge — when the drip is exhausted and the guest still
  // hasn't responded, tell the host so they can share the link directly. One
  // digest per host, logged per invitation so it only ever sends once.
  const { data: alreadyNudged } = await admin
    .from('notifications_log')
    .select('invitation_id')
    .eq('type', INVITE_HOST_NUDGE_LOG_TYPE)
    .not('invitation_id', 'is', null);
  const nudgedSet = new Set(
    (alreadyNudged ?? []).map((r) => r.invitation_id as string)
  );

  const stalled = (pendingInvites ?? []).filter(
    (inv) => !nudgedSet.has(inv.id) && isInviteStalledByAge(inv.created_at, now)
  );

  if (stalled.length > 0) {
    const stalledIds = stalled.map((inv) => inv.id);
    const { data: stalledDetails } = await admin
      .from('invitations')
      .select(
        'id, token, guest_name, guest_email, property:properties(name, owner_id, owner:users!owner_id(id, email, name, notification_prefs))'
      )
      .in('id', stalledIds);

    type StalledOwner = {
      id: string;
      email: string;
      name: string;
      invitations: {
        guestName: string;
        guestEmail: string;
        propertyName: string;
        inviteUrl: string;
      }[];
      invitationIds: string[];
    };
    const byOwner = new Map<string, StalledOwner>();

    type StalledProperty = {
      name: string;
      owner_id: string;
      owner?:
        | {
            id: string;
            email: string;
            name: string | null;
            notification_prefs?: NotificationPrefs;
          }
        | {
            id: string;
            email: string;
            name: string | null;
            notification_prefs?: NotificationPrefs;
          }[];
    };

    for (const inv of stalledDetails ?? []) {
      const propertyRaw = inv.property as unknown;
      const property = (
        Array.isArray(propertyRaw) ? propertyRaw[0] : propertyRaw
      ) as StalledProperty | null;
      const owner = property?.owner
        ? Array.isArray(property.owner)
          ? property.owner[0]
          : property.owner
        : null;
      if (!owner) continue;
      if (!wantsEmail(owner.notification_prefs, 'invitation_stalled')) continue;
      if (!byOwner.has(owner.id)) {
        byOwner.set(owner.id, {
          id: owner.id,
          email: owner.email,
          name: owner.name ?? 'there',
          invitations: [],
          invitationIds: [],
        });
      }
      const bucket = byOwner.get(owner.id)!;
      bucket.invitations.push({
        guestName: inv.guest_name ?? inv.guest_email,
        guestEmail: inv.guest_email,
        propertyName: property!.name,
        inviteUrl: inviteUrl(inv.token),
      });
      bucket.invitationIds.push(inv.id);
    }

    for (const owner of Array.from(byOwner.values())) {
      await notifyInviteStalled(
        owner.id,
        owner.email,
        owner.name,
        owner.invitations
      );
      for (const invitationId of owner.invitationIds) {
        await admin.from('notifications_log').insert({
          invitation_id: invitationId,
          type: INVITE_HOST_NUDGE_LOG_TYPE,
        });
        inviteStalled++;
      }
    }
  }

  // Invitation expiring digest — once per day at a fixed UTC hour so hosts
  // don't get an hourly repeat.
  let expiringCount = 0;
  if (now.getUTCHours() === DIGEST_UTC_HOUR) {
    const in48h = addDays(now, 2);
    const { data: expiring } = await admin
      .from('invitations')
      .select('*, property:properties(name, owner_id, owner:users!owner_id(id, email, name, notification_prefs))')
      .eq('status', 'pending')
      .not('expires_at', 'is', null)
      .lte('expires_at', in48h.toISOString())
      .gte('expires_at', now.toISOString());

    expiringCount = expiring?.length ?? 0;

    const byOwner = new Map<
      string,
      { id: string; email: string; name: string; invitations: { guestName: string; propertyName: string; expiresAt: string }[] }
    >();

    for (const inv of expiring ?? []) {
      const owner = inv.property?.owner as {
        id: string;
        email: string;
        name: string | null;
        notification_prefs?: NotificationPrefs;
      };
      if (!owner) continue;
      // Opt-out: skip hosts who muted invitation-expiring notices.
      if (!wantsEmail(owner.notification_prefs, 'invitation_expiring')) continue;
      const key = owner.id;
      if (!byOwner.has(key)) {
        byOwner.set(key, {
          id: owner.id,
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
        owner.id,
        owner.email,
        owner.name,
        owner.invitations
      );
    }
  }

  // Flush the email outbox synchronously within this guaranteed daily run, so
  // the queue is drained even if a per-request after() drain was skipped. Bound
  // the rounds to stay well clear of the function timeout.
  let outboxSent = 0;
  for (let round = 0; round < 20; round++) {
    const drained = await drainEmailOutbox();
    outboxSent += drained.sent;
    if (drained.claimed === 0) break;
  }

  return NextResponse.json({
    ok: true,
    processed: approvedVisits?.length ?? 0,
    lifecycleSends,
    inviteReminderSends,
    inviteStalled,
    expiring: expiringCount,
    outboxSent,
  });
}
