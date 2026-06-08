import type { ReactElement } from 'react';
import type { NotificationPrefs } from '@/types/database';

import InvitationSentEmail from '../../../emails/invitation-sent';
import StayRequestedEmail from '../../../emails/stay-requested';
import BookingApprovedEmail from '../../../emails/booking-approved';
import BookingDeclinedEmail from '../../../emails/booking-declined';
import BookingCancelledEmail from '../../../emails/booking-cancelled';
import TripReminderEmail from '../../../emails/trip-reminder';
import InvitationExpiringEmail from '../../../emails/invitation-expiring';

export type MessageChannel = 'email' | 'sms';

export type MessageCategory =
  | 'Invitations'
  | 'Booking requests'
  | 'Confirmations'
  | 'Reminders';

export interface MessagePreviewVariant {
  /** Short label shown when a message renders differently per recipient/context. */
  label: string;
  /** Example subject line for this variant. */
  subject: string;
  /** Rendered React Email element used to generate an HTML preview. */
  element: ReactElement;
}

export interface AutomatedMessage {
  /** Stable id used in the admin URL. */
  id: string;
  name: string;
  channel: MessageChannel;
  category: MessageCategory;
  /** Whether the message is wired up today or planned for the future. */
  status: 'active' | 'planned';
  /** Who receives this message. */
  audience: string;
  /** Plain-language summary of what the message is. */
  description: string;
  /** What user action or system event causes it to send. */
  trigger: string;
  /** When it sends relative to the trigger (timing/cadence). */
  timing: string;
  /**
   * notifications_log `type` values this message writes. Used to match real
   * send history. Empty when the message is not logged.
   */
  logTypes: string[];
  /**
   * Host notification preference that can suppress this message, plus whether
   * that preference is currently enforced in code.
   */
  notificationPref: {
    key: keyof NotificationPrefs;
    label: string;
    enforced: boolean;
  } | null;
  /** Source file where the send is triggered, for engineering reference. */
  source: string;
  variants: MessagePreviewVariant[];
}

// ---------------------------------------------------------------------------
// Sample data used purely to render representative previews. None of this is
// real guest/host data — it just exercises every field in each template.
// ---------------------------------------------------------------------------

const SAMPLE = {
  guestName: 'Jordan Rivera',
  ownerName: 'Sam Patel',
  propertyName: 'The Lake House',
  dates: 'Jul 12, 2026 – Jul 16, 2026',
  rooms: 'Master Suite, Bunk Room',
  partySize: 4,
  inviteUrl: 'https://guesthouse.app/invite/sample-token',
  dashboardUrl: 'https://guesthouse.app/dashboard',
  requestUrl: 'https://guesthouse.app/dashboard/the-lake-house/requests',
  address: '482 Shoreline Dr, Tahoe City, CA',
  directions: 'Gate code is 1995. Park in the gravel area to the right.',
  wifiName: 'LakeHouse-5G',
  wifiPassword: 'sunset2026',
  checkIn: 'Self check-in after 3pm. Lockbox code is 4821.',
  houseRules: 'No smoking indoors. Quiet hours after 10pm.',
  expiresAt: 'Jun 14, 2026',
};

export const AUTOMATED_MESSAGES: AutomatedMessage[] = [
  {
    id: 'invitation-sent',
    name: 'Invitation sent',
    channel: 'email',
    category: 'Invitations',
    status: 'active',
    audience: 'Invited guest',
    description:
      'Invites a guest to view a property and request a stay, with an optional personal message and expiry date.',
    trigger: 'A host creates and sends an invitation.',
    timing: 'Immediately',
    logTypes: ['invitation_sent'],
    notificationPref: null,
    source: 'src/app/api/invitations/route.ts',
    variants: [
      {
        label: 'Default',
        subject: `You're invited to ${SAMPLE.propertyName}`,
        element: (
          <InvitationSentEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            inviteUrl={SAMPLE.inviteUrl}
            message="We'd love to have you for the long weekend — the lake is perfect this time of year."
            expiresAt={SAMPLE.expiresAt}
          />
        ),
      },
    ],
  },
  {
    id: 'stay-requested',
    name: 'Stay request',
    channel: 'email',
    category: 'Booking requests',
    status: 'active',
    audience: 'Property owner + co-managers',
    description:
      'Notifies hosts that a guest has requested a stay, with Approve/Decline buttons that deep-link into the dashboard.',
    trigger: 'A guest submits a booking that requires approval.',
    timing: 'Immediately',
    logTypes: ['stay_requested'],
    notificationPref: {
      key: 'booking_requests',
      label: 'Booking requests',
      enforced: true,
    },
    source: 'src/app/api/bookings/route.ts',
    variants: [
      {
        label: 'Default',
        subject: `Stay request from ${SAMPLE.guestName}`,
        element: (
          <StayRequestedEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            dates={SAMPLE.dates}
            rooms={SAMPLE.rooms}
            partySize={SAMPLE.partySize}
            notes="Bringing two kids and a (very well-behaved) dog if that's okay."
            approveUrl={SAMPLE.requestUrl}
            declineUrl={SAMPLE.requestUrl}
          />
        ),
      },
    ],
  },
  {
    id: 'booking-approved',
    name: 'Booking confirmed',
    channel: 'email',
    category: 'Confirmations',
    status: 'active',
    audience: 'Guest',
    description:
      'Confirms an approved stay with full property details (address, directions, WiFi, check-in, house rules) and attaches a calendar (.ics) file.',
    trigger:
      'A host approves a request, a booking auto-approves, a host creates an offline booking, or an approved booking is updated.',
    timing: 'Immediately',
    logTypes: ['booking_approved'],
    notificationPref: null,
    source: 'src/app/api/bookings/[id]/route.ts',
    variants: [
      {
        label: 'Default',
        subject: `Your stay at ${SAMPLE.propertyName} is confirmed`,
        element: (
          <BookingApprovedEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            dates={SAMPLE.dates}
            rooms={SAMPLE.rooms}
            address={SAMPLE.address}
            directions={SAMPLE.directions}
            wifiName={SAMPLE.wifiName}
            wifiPassword={SAMPLE.wifiPassword}
            checkIn={SAMPLE.checkIn}
            houseRules={SAMPLE.houseRules}
            coguestNote="Others staying during your dates: The Garcia family and others."
            profileUrl={SAMPLE.inviteUrl}
          />
        ),
      },
    ],
  },
  {
    id: 'booking-declined',
    name: 'Booking declined',
    channel: 'email',
    category: 'Confirmations',
    status: 'active',
    audience: 'Guest',
    description:
      'Lets a guest know their request was not approved, with an optional message from the host and a link to request again.',
    trigger: 'A host declines a stay request.',
    timing: 'Immediately',
    logTypes: ['booking_declined'],
    notificationPref: null,
    source: 'src/app/api/bookings/[id]/route.ts',
    variants: [
      {
        label: 'Default',
        subject: `Stay request declined — ${SAMPLE.propertyName}`,
        element: (
          <BookingDeclinedEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            dates={SAMPLE.dates}
            message="So sorry — we have family in town those dates. Would love to host you later in the summer!"
            inviteUrl={SAMPLE.inviteUrl}
          />
        ),
      },
    ],
  },
  {
    id: 'booking-cancelled',
    name: 'Booking cancelled',
    channel: 'email',
    category: 'Confirmations',
    status: 'active',
    audience: 'Host or guest (whoever did not cancel)',
    description:
      'Notifies the other party that a confirmed stay was cancelled. The wording changes depending on who cancelled.',
    trigger: 'A guest or host cancels a confirmed booking.',
    timing: 'Immediately',
    logTypes: ['booking_cancelled_guest', 'booking_cancelled_owner'],
    notificationPref: {
      key: 'booking_cancelled',
      label: 'Booking cancelled',
      enforced: false,
    },
    source: 'src/app/api/bookings/[id]/route.ts',
    variants: [
      {
        label: 'To host (guest cancelled)',
        subject: `${SAMPLE.guestName} cancelled their stay`,
        element: (
          <BookingCancelledEmail
            recipientName={SAMPLE.ownerName}
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            dates={SAMPLE.dates}
            cancelledBy="guest"
          />
        ),
      },
      {
        label: 'To guest (host cancelled)',
        subject: `Your stay at ${SAMPLE.propertyName} was cancelled`,
        element: (
          <BookingCancelledEmail
            recipientName={SAMPLE.guestName}
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            dates={SAMPLE.dates}
            cancelledBy="owner"
          />
        ),
      },
    ],
  },
  {
    id: 'trip-reminder',
    name: 'Trip reminder',
    channel: 'email',
    category: 'Reminders',
    status: 'active',
    audience: 'Guest',
    description:
      'Reminds a guest about an upcoming stay. The 1-day reminder also includes check-in instructions.',
    trigger: 'A confirmed booking is exactly 7 days or 1 day before check-in.',
    timing: 'Scheduled — daily cron at 9:00 UTC',
    logTypes: ['reminder_7d', 'reminder_1d'],
    notificationPref: null,
    source: 'src/app/api/cron/reminders/route.ts',
    variants: [
      {
        label: '7 days before',
        subject: `One week until your stay at ${SAMPLE.propertyName}`,
        element: (
          <TripReminderEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            dates={SAMPLE.dates}
            daysUntil={7}
            address={SAMPLE.address}
            wifiName={SAMPLE.wifiName}
            wifiPassword={SAMPLE.wifiPassword}
            profileUrl={SAMPLE.inviteUrl}
          />
        ),
      },
      {
        label: '1 day before',
        subject: `Tomorrow: your stay at ${SAMPLE.propertyName}`,
        element: (
          <TripReminderEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            dates={SAMPLE.dates}
            daysUntil={1}
            checkIn={SAMPLE.checkIn}
            address={SAMPLE.address}
            wifiName={SAMPLE.wifiName}
            wifiPassword={SAMPLE.wifiPassword}
            profileUrl={SAMPLE.inviteUrl}
          />
        ),
      },
    ],
  },
  {
    id: 'invitation-expiring',
    name: 'Invitations expiring',
    channel: 'email',
    category: 'Reminders',
    status: 'active',
    audience: 'Property owner',
    description:
      'A digest reminding a host about pending invitations that are about to expire, grouped into a single email per host.',
    trigger: 'A pending invitation expires within the next 48 hours.',
    timing: 'Scheduled — daily cron at 9:00 UTC',
    logTypes: [],
    notificationPref: {
      key: 'invitation_expiring',
      label: 'Invitation expiring',
      enforced: false,
    },
    source: 'src/app/api/cron/reminders/route.ts',
    variants: [
      {
        label: 'Default',
        subject: 'Invitations expiring in 48 hours',
        element: (
          <InvitationExpiringEmail
            ownerName={SAMPLE.ownerName}
            invitations={[
              {
                guestName: SAMPLE.guestName,
                propertyName: SAMPLE.propertyName,
                expiresAt: SAMPLE.expiresAt,
              },
              {
                guestName: 'Alex Chen',
                propertyName: SAMPLE.propertyName,
                expiresAt: 'Jun 15, 2026',
              },
            ]}
            dashboardUrl={SAMPLE.dashboardUrl}
          />
        ),
      },
    ],
  },
];

export function getMessage(id: string): AutomatedMessage | undefined {
  return AUTOMATED_MESSAGES.find((m) => m.id === id);
}

/** All notifications_log types that map to a known message, for history queries. */
export const ALL_LOG_TYPES: string[] = AUTOMATED_MESSAGES.flatMap(
  (m) => m.logTypes
);

/** Reverse lookup from a notifications_log type to its message. */
export function messageForLogType(
  type: string
): AutomatedMessage | undefined {
  return AUTOMATED_MESSAGES.find((m) => m.logTypes.includes(type));
}
