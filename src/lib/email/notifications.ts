import { sendEmail, logNotification, appUrl } from '@/lib/email/send';
import { generateIcs } from '@/lib/ical';
import { formatDateRange, formatDate } from '@/lib/dates';
import { inviteUrl } from '@/lib/invitations';
import { getBookingWithDetails } from '@/lib/bookings';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BookingWithDetails } from '@/types/database';

import InvitationSentEmail from '../../../emails/invitation-sent';
import StayRequestedEmail from '../../../emails/stay-requested';
import BookingApprovedEmail from '../../../emails/booking-approved';
import BookingDeclinedEmail from '../../../emails/booking-declined';
import BookingCancelledEmail from '../../../emails/booking-cancelled';
import TripReminderEmail from '../../../emails/trip-reminder';
import InvitationExpiringEmail from '../../../emails/invitation-expiring';

export async function notifyInvitationSent(invitationId: string) {
  const admin = createAdminClient();
  const { data: inv } = await admin
    .from('invitations')
    .select('*, property:properties(name)')
    .eq('id', invitationId)
    .single();

  if (!inv) return;

  await sendEmail({
    to: inv.guest_email,
    subject: `You're invited to ${inv.property.name}`,
    react: InvitationSentEmail({
      guestName: inv.guest_name ?? inv.guest_email.split('@')[0],
      propertyName: inv.property.name,
      inviteUrl: inviteUrl(inv.token),
      message: inv.message ?? undefined,
      expiresAt: inv.expires_at
        ? formatDate(inv.expires_at)
        : undefined,
    }),
  });

  await logNotification({ invitationId, type: 'invitation_sent' });
}

export async function notifyStayRequested(bookingId: string) {
  const booking = await getBookingWithDetails(bookingId);
  if (!booking) return;

  const admin = createAdminClient();
  const { data: property } = await admin
    .from('properties')
    .select('*, owner:users!owner_id(*)')
    .eq('id', booking.property_id)
    .single();

  if (!property) return;

  const { data: managers } = await admin
    .from('property_managers')
    .select('user:users(email, notification_prefs)')
    .eq('property_id', booking.property_id);

  const recipients: string[] = [];
  const ownerRaw = property.owner;
  const owner = (Array.isArray(ownerRaw) ? ownerRaw[0] : ownerRaw) as {
    email: string;
    notification_prefs?: { booking_requests?: boolean };
  };
  if (owner.notification_prefs?.booking_requests !== false) {
    recipients.push(owner.email);
  }

  for (const m of managers ?? []) {
    const userRaw = m.user;
    const user = (Array.isArray(userRaw) ? userRaw[0] : userRaw) as {
      email: string;
      notification_prefs?: { booking_requests?: boolean };
    };
    if (user.notification_prefs?.booking_requests !== false) {
      recipients.push(user.email);
    }
  }

  const base = appUrl();
  const dates = formatDateRange(booking.dates.check_in, booking.dates.check_out);
  const rooms = booking.rooms.map((r) => r.name).join(', ');

  const guestLabel =
    booking.guest.name ?? booking.guest.email ?? 'A guest';

  for (const email of Array.from(new Set(recipients))) {
    await sendEmail({
      to: email,
      subject: `Stay request from ${guestLabel}`,
      react: StayRequestedEmail({
        guestName: guestLabel,
        propertyName: booking.property.name,
        dates,
        rooms,
        partySize: booking.party_size,
        notes: booking.notes ?? undefined,
        approveUrl: `${base}/dashboard/${booking.property.slug}/requests?booking=${bookingId}&action=approve`,
        declineUrl: `${base}/dashboard/${booking.property.slug}/requests?booking=${bookingId}&action=decline`,
      }),
    });
  }

  await logNotification({ bookingId, type: 'stay_requested' });
}

export async function notifyBookingApproved(bookingId: string) {
  const booking = await getBookingWithDetails(bookingId);
  if (!booking || !booking.guest.email) return;

  const icsContent = generateIcs(booking);
  const dates = formatDateRange(booking.dates.check_in, booking.dates.check_out);
  const rooms = booking.rooms.map((r) => r.name).join(', ');

  const { getCoGuestsForDates } = await import('@/lib/coguests');
  const coguests = await getCoGuestsForDates(
    booking.property_id,
    booking.dates.check_in,
    booking.dates.check_out,
    booking.guest_user_id ?? undefined
  );
  let coguestNote: string | undefined;
  if (coguests.visible.length > 0) {
    const names = coguests.visible.map((g) => g.label).join(', ');
    coguestNote = `Others staying during your dates: ${names}${coguests.hasHidden ? ' and others' : ''}.`;
  }

  await sendEmail({
    to: booking.guest.email,
    subject: `Your stay at ${booking.property.name} is confirmed`,
    react: BookingApprovedEmail({
      guestName: booking.guest.name ?? 'there',
      propertyName: booking.property.name,
      dates,
      rooms,
      address: booking.property.address ?? undefined,
      directions: booking.property.directions ?? undefined,
      wifiName: booking.property.wifi_name ?? undefined,
      wifiPassword: booking.property.wifi_password ?? undefined,
      checkIn: booking.property.check_in_instructions ?? undefined,
      houseRules: booking.property.house_rules ?? undefined,
      coguestNote,
      profileUrl: booking.invitation
        ? inviteUrl(booking.invitation.token)
        : undefined,
    }),
    attachments: [
      {
        filename: 'stay.ics',
        content: Buffer.from(icsContent),
      },
    ],
  });

  await logNotification({
    userId: booking.guest_user_id ?? undefined,
    bookingId,
    type: 'booking_approved',
  });
}

export async function notifyBookingDeclined(
  bookingId: string,
  declineMessage?: string
) {
  const booking = await getBookingWithDetails(bookingId);
  if (!booking || !booking.guest.email || !booking.invitation) return;

  await sendEmail({
    to: booking.guest.email,
    subject: `Stay request declined — ${booking.property.name}`,
    react: BookingDeclinedEmail({
      guestName: booking.guest.name ?? 'there',
      propertyName: booking.property.name,
      dates: formatDateRange(booking.dates.check_in, booking.dates.check_out),
      message: declineMessage,
      inviteUrl: inviteUrl(booking.invitation.token),
    }),
  });

  await logNotification({
    userId: booking.guest_user_id ?? undefined,
    bookingId,
    type: 'booking_declined',
  });
}

export async function notifyBookingCancelled(
  bookingId: string,
  cancelledBy: 'guest' | 'owner'
) {
  const booking = await getBookingWithDetails(bookingId);
  if (!booking) return;

  const admin = createAdminClient();
  const { data: property } = await admin
    .from('properties')
    .select('*, owner:users!owner_id(*)')
    .eq('id', booking.property_id)
    .single();

  if (!property) return;

  const dates = formatDateRange(booking.dates.check_in, booking.dates.check_out);
  const guestName =
    booking.guest.name ?? booking.guest.email ?? 'Guest';

  if (cancelledBy === 'guest') {
    const ownerRaw = property.owner;
    const owner = (Array.isArray(ownerRaw) ? ownerRaw[0] : ownerRaw) as {
      email: string;
      name: string | null;
    };
    await sendEmail({
      to: owner.email,
      subject: `${guestName} cancelled their stay`,
      react: BookingCancelledEmail({
        recipientName: owner.name ?? 'there',
        guestName,
        propertyName: booking.property.name,
        dates,
        cancelledBy: 'guest',
      }),
    });
  } else if (booking.notify_guest && booking.guest.email) {
    await sendEmail({
      to: booking.guest.email,
      subject: `Your stay at ${booking.property.name} was cancelled`,
      react: BookingCancelledEmail({
        recipientName: booking.guest.name ?? 'there',
        guestName,
        propertyName: booking.property.name,
        dates,
        cancelledBy: 'owner',
      }),
    });
  }

  await logNotification({ bookingId, type: `booking_cancelled_${cancelledBy}` });
}

export async function notifyTripReminder(
  booking: BookingWithDetails,
  daysUntil: number
) {
  if (!booking.notify_guest || !booking.guest.email) return;

  const type = daysUntil <= 1 ? 'reminder_1d' : 'reminder_7d';

  await sendEmail({
    to: booking.guest.email,
    subject:
      daysUntil <= 1
        ? `Tomorrow: your stay at ${booking.property.name}`
        : `One week until your stay at ${booking.property.name}`,
    react: TripReminderEmail({
      guestName: booking.guest.name ?? 'there',
      propertyName: booking.property.name,
      dates: formatDateRange(booking.dates.check_in, booking.dates.check_out),
      daysUntil,
      checkIn: booking.property.check_in_instructions ?? undefined,
      address: booking.property.address ?? undefined,
      wifiName: booking.property.wifi_name ?? undefined,
      wifiPassword: booking.property.wifi_password ?? undefined,
      profileUrl: booking.invitation
        ? inviteUrl(booking.invitation.token)
        : undefined,
    }),
  });

  await logNotification({
    userId: booking.guest_user_id ?? undefined,
    bookingId: booking.id,
    type,
  });
}

export async function notifyInvitationsExpiring(
  ownerEmail: string,
  ownerName: string,
  invitations: { guestName: string; propertyName: string; expiresAt: string }[]
) {
  await sendEmail({
    to: ownerEmail,
    subject: 'Invitations expiring in 48 hours',
    react: InvitationExpiringEmail({
      ownerName,
      invitations,
      dashboardUrl: `${appUrl()}/dashboard`,
    }),
  });
}
