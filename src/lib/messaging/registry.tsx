import type { ReactElement } from 'react';
import type { NotificationPrefs } from '@/types/database';
import { googleCalendarUrl, outlookCalendarUrl } from '@/lib/calendar-links';

import InvitationSentEmail from '../../../emails/invitation-sent';
import InviteReminderEmail from '../../../emails/invite-reminder';
import InviteStalledHostEmail from '../../../emails/invite-stalled-host';
import StayRequestedEmail from '../../../emails/stay-requested';
import VisitApprovedEmail from '../../../emails/visit-approved';
import VisitDeclinedEmail from '../../../emails/visit-declined';
import VisitCancelledEmail from '../../../emails/visit-cancelled';
import TripReminderEmail from '../../../emails/trip-reminder';
import InvitationExpiringEmail from '../../../emails/invitation-expiring';
import CheckoutInstructionsEmail from '../../../emails/checkout-instructions';
import PostStayThankYouEmail from '../../../emails/post-stay-thankyou';
import AuthConfirmSignupEmail from '../../../emails/auth-confirm-signup';
import AuthMagicLinkEmail from '../../../emails/auth-magic-link';
import AuthRecoveryEmail from '../../../emails/auth-recovery';
import ProductUpdateEmail from '../../../emails/product-update';
import StayConfirmedEmail from '../../../emails/stay-confirmed';
import RequestReceivedEmail from '../../../emails/request-received';
import ArrivalWelcomeEmail from '../../../emails/arrival-welcome';

export type MessageChannel = 'email' | 'sms';

/** Who an email is addressed to, used to group the admin view into flows. */
export type MessageRecipient = 'guest' | 'host' | 'account';

export type MessageCategory =
  | 'Account'
  | 'Invitations'
  | 'Visit requests'
  | 'Confirmations'
  | 'Reminders'
  | 'Marketing';

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
  /** Structured recipient(s) — used to bucket messages into Guest/Host/Account flows. */
  recipients: MessageRecipient[];
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
   * Where replies go, when it differs from the sender. Undefined means replies
   * go to the configured RESEND_FROM address.
   */
  replyTo?: string;
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
  guestEmail: 'jordan.rivera@example.com',
  ownerName: 'Sam Patel',
  propertyName: 'The Lake House',
  dates: 'Jul 12, 2026 – Jul 16, 2026',
  checkInDate: '2026-07-12',
  checkOutDate: '2026-07-16',
  rooms: 'Master Suite, Bunk Room',
  partySize: 4,
  inviteUrl: 'https://gracious.host/invite/sample-token',
  dashboardUrl: 'https://gracious.host/dashboard',
  requestUrl: 'https://gracious.host/dashboard/the-lake-house/requests',
  address: '482 Shoreline Dr, Tahoe City, CA',
  directions: 'Gate code is 1995. Park in the gravel area to the right.',
  wifiName: 'LakeHouse-5G',
  wifiPassword: 'sunset2026',
  checkIn: 'Self check-in after 3pm. Lockbox code is 4821.',
  houseRules: 'No smoking indoors. Quiet hours after 10pm.',
  checkoutTime: '11:00 AM',
  checkoutInstructions:
    'Strip the beds, start the dishwasher, and drop the keys back in the lockbox.',
  expiresAt: 'Jun 14, 2026',
  authUrl: 'https://gracious.host/auth/confirm?token_hash=sample',
  heroImageUrl:
    'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=928&q=70',
};

const SAMPLE_VISIT_EVENT = {
  title: `Visit at ${SAMPLE.propertyName}`,
  description: `Property: ${SAMPLE.propertyName}\nRooms: ${SAMPLE.rooms}`,
  location: SAMPLE.address,
  checkIn: '2026-07-12',
  checkOut: '2026-07-16',
};

const SAMPLE_GOOGLE_CAL_URL = googleCalendarUrl(SAMPLE_VISIT_EVENT);
const SAMPLE_OUTLOOK_CAL_URL = outlookCalendarUrl(SAMPLE_VISIT_EVENT);

export const AUTOMATED_MESSAGES: AutomatedMessage[] = [
  {
    id: 'auth-confirm-signup',
    name: 'Confirm email (signup)',
    channel: 'email',
    category: 'Account',
    recipients: ['account'],
    status: 'active',
    audience: 'New user',
    description:
      'Confirms a new account\u2019s email address. Sent by Supabase Auth through our Send Email hook so it matches the Gracious design.',
    trigger: 'A user signs up and Supabase requests email confirmation.',
    timing: 'Immediately',
    logTypes: [],
    notificationPref: null,
    source: 'src/app/api/auth/email-hook/route.ts',
    variants: [
      {
        label: 'Default',
        subject: 'Confirm your email for Gracious',
        element: (
          <AuthConfirmSignupEmail confirmUrl={SAMPLE.authUrl} token="123456" />
        ),
      },
    ],
  },
  {
    id: 'auth-magic-link',
    name: 'Sign-in link (magic link)',
    channel: 'email',
    category: 'Account',
    recipients: ['account'],
    status: 'active',
    audience: 'Existing user',
    description:
      'A passwordless sign-in link. Sent by Supabase Auth through our Send Email hook.',
    trigger: 'A user requests a magic-link sign-in.',
    timing: 'Immediately',
    logTypes: [],
    notificationPref: null,
    source: 'src/app/api/auth/email-hook/route.ts',
    variants: [
      {
        label: 'Default',
        subject: 'Your Gracious sign-in link',
        element: <AuthMagicLinkEmail signInUrl={SAMPLE.authUrl} token="123456" />,
      },
    ],
  },
  {
    id: 'auth-recovery',
    name: 'Password reset',
    channel: 'email',
    category: 'Account',
    recipients: ['account'],
    status: 'active',
    audience: 'Existing user',
    description:
      'A password reset link. Sent by Supabase Auth through our Send Email hook.',
    trigger: 'A user requests a password reset.',
    timing: 'Immediately',
    logTypes: [],
    notificationPref: null,
    source: 'src/app/api/auth/email-hook/route.ts',
    variants: [
      {
        label: 'Default',
        subject: 'Reset your Gracious password',
        element: <AuthRecoveryEmail resetUrl={SAMPLE.authUrl} token="123456" />,
      },
    ],
  },
  {
    id: 'invitation-sent',
    name: 'Invitation sent',
    channel: 'email',
    category: 'Invitations',
    recipients: ['guest'],
    status: 'active',
    audience: 'Invited guest',
    description:
      'Invites a guest to view a property and request a visit, with an optional personal message and expiry date. Sent as "{host} via Gracious" so the inbox row leads with the host.',
    trigger: 'A host creates and sends an invitation.',
    timing: 'Immediately',
    replyTo: 'The host\u2019s email address — guests can reply directly',
    logTypes: ['invitation_sent'],
    notificationPref: null,
    source: 'src/app/api/invitations/route.ts',
    variants: [
      {
        label: 'With photo',
        subject: `${SAMPLE.ownerName} has invited you to ${SAMPLE.propertyName}`,
        element: (
          <InvitationSentEmail
            guestName={SAMPLE.guestName}
            hostName={SAMPLE.ownerName}
            propertyName={SAMPLE.propertyName}
            inviteUrl={SAMPLE.inviteUrl}
            message="We'd love to have you for the long weekend — the lake is perfect this time of year."
            expiresAt={SAMPLE.expiresAt}
            heroImageUrl={SAMPLE.heroImageUrl}
          />
        ),
      },
      {
        label: 'No photo (branded)',
        subject: `${SAMPLE.ownerName} has invited you to ${SAMPLE.propertyName}`,
        element: (
          <InvitationSentEmail
            guestName={SAMPLE.guestName}
            hostName={SAMPLE.ownerName}
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
    id: 'invite-reminder',
    name: 'Invite reminder',
    channel: 'email',
    category: 'Invitations',
    recipients: ['guest'],
    status: 'active',
    audience: 'Invited guest who hasn\u2019t responded',
    description:
      'A drip of up to three daily nudges to a guest who hasn\u2019t responded to their invitation, escalating to a final "last reminder". Sent as "{host} via Gracious", like the original invite.',
    trigger:
      'A pending invitation is 1, 2, or 3 days old and the guest hasn\u2019t booked or requested.',
    timing: 'Scheduled — once per day on days 1, 2, and 3 after the invite',
    replyTo: 'The host\u2019s email address — guests can reply directly',
    logTypes: ['invite_reminder_1', 'invite_reminder_2', 'invite_reminder_3'],
    notificationPref: null,
    source: 'src/app/api/cron/reminders/route.ts',
    variants: [
      {
        label: 'First nudge',
        subject: `Reminder: ${SAMPLE.ownerName} invited you to ${SAMPLE.propertyName}`,
        element: (
          <InviteReminderEmail
            guestName={SAMPLE.guestName}
            hostName={SAMPLE.ownerName}
            propertyName={SAMPLE.propertyName}
            inviteUrl={SAMPLE.inviteUrl}
            message="We'd love to have you for the long weekend — the lake is perfect this time of year."
            expiresAt={SAMPLE.expiresAt}
            heroImageUrl={SAMPLE.heroImageUrl}
            step={1}
          />
        ),
      },
      {
        label: 'Last reminder',
        subject: `Last reminder: your invite to ${SAMPLE.propertyName}`,
        element: (
          <InviteReminderEmail
            guestName={SAMPLE.guestName}
            hostName={SAMPLE.ownerName}
            propertyName={SAMPLE.propertyName}
            inviteUrl={SAMPLE.inviteUrl}
            expiresAt={SAMPLE.expiresAt}
            heroImageUrl={SAMPLE.heroImageUrl}
            step={3}
          />
        ),
      },
    ],
  },
  {
    id: 'invite-stalled',
    name: 'Invite went quiet',
    channel: 'email',
    category: 'Invitations',
    recipients: ['host'],
    status: 'active',
    audience: 'Property owner',
    description:
      'A digest telling a host which invited guests still haven\u2019t responded after the reminder drip. Each guest gets a person card with a big \u201cForward invite\u201d button that opens a pre-drafted email (mailto) to that guest, so the host can re-send it in one tap.',
    trigger:
      'A pending invitation is still unanswered 4 days after it was sent.',
    timing: 'Scheduled — once, the day after the final guest reminder',
    logTypes: ['invite_host_nudge'],
    notificationPref: {
      key: 'invitation_stalled',
      label: 'Invitation went quiet',
      enforced: true,
    },
    source: 'src/app/api/cron/reminders/route.ts',
    variants: [
      {
        label: 'Default',
        subject: "Some guests haven't opened their invite",
        element: (
          <InviteStalledHostEmail
            ownerName={SAMPLE.ownerName}
            invitations={[
              {
                guestName: SAMPLE.guestName,
                guestEmail: SAMPLE.guestEmail,
                propertyName: SAMPLE.propertyName,
                inviteUrl: SAMPLE.inviteUrl,
              },
              {
                guestName: 'Alex Chen',
                guestEmail: 'alex.chen@example.com',
                propertyName: SAMPLE.propertyName,
                inviteUrl: 'https://gracious.host/invite/another-token',
              },
            ]}
            dashboardUrl={SAMPLE.dashboardUrl}
          />
        ),
      },
    ],
  },
  {
    id: 'stay-requested',
    name: 'Visit request',
    channel: 'email',
    category: 'Visit requests',
    recipients: ['host'],
    status: 'active',
    audience: 'Property owner + co-managers',
    description:
      'Notifies hosts that a guest has requested a stay, with Approve/Decline buttons that deep-link into the dashboard.',
    trigger: 'A guest submits a visit request that requires approval.',
    timing: 'Immediately',
    replyTo: 'The guest\u2019s email address — hosts can reply directly',
    logTypes: ['stay_requested'],
    notificationPref: {
      key: 'visit_requests',
      label: 'Visit requests',
      enforced: true,
    },
    source: 'src/app/api/visits/route.ts',
    variants: [
      {
        label: 'Default',
        subject: `Stay request from ${SAMPLE.guestName}`,
        element: (
          <StayRequestedEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            checkInDate={SAMPLE.checkInDate}
            checkOutDate={SAMPLE.checkOutDate}
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
    id: 'request-received',
    name: 'Request received',
    channel: 'email',
    category: 'Visit requests',
    recipients: ['guest'],
    status: 'active',
    audience: 'Guest',
    description:
      'A receipt to the guest confirming their stay request went through and the hosts have been notified. Only sent when the invitation requires approval.',
    trigger: 'A guest submits a visit request that requires host approval.',
    timing: 'Immediately',
    logTypes: ['request_received'],
    notificationPref: null,
    source: 'src/app/api/visits/route.ts',
    variants: [
      {
        label: 'Default',
        subject: `Your request for ${SAMPLE.propertyName} is in`,
        element: (
          <RequestReceivedEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            checkInDate={SAMPLE.checkInDate}
            checkOutDate={SAMPLE.checkOutDate}
            rooms={SAMPLE.rooms}
          />
        ),
      },
    ],
  },
  {
    id: 'stay-confirmed',
    name: 'Visit confirmed',
    channel: 'email',
    category: 'Visit requests',
    recipients: ['host'],
    status: 'active',
    audience: 'Property owner + co-managers',
    description:
      'Tells hosts a guest booked a stay that didn\u2019t need approval, so confirmed visits never appear on the calendar silently.',
    trigger: 'A guest books via an invitation that doesn\u2019t require approval.',
    timing: 'Immediately',
    replyTo: 'The guest\u2019s email address — hosts can reply directly',
    logTypes: ['stay_booked'],
    notificationPref: {
      key: 'visit_requests',
      label: 'Visit requests',
      enforced: true,
    },
    source: 'src/app/api/visits/route.ts',
    variants: [
      {
        label: 'Default',
        subject: `${SAMPLE.guestName} booked a stay at ${SAMPLE.propertyName}`,
        element: (
          <StayConfirmedEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            checkInDate={SAMPLE.checkInDate}
            checkOutDate={SAMPLE.checkOutDate}
            rooms={SAMPLE.rooms}
            partySize={SAMPLE.partySize}
            notes="Bringing two kids and a (very well-behaved) dog if that's okay."
            visitUrl={SAMPLE.dashboardUrl}
          />
        ),
      },
    ],
  },
  {
    id: 'visit-approved',
    name: 'Visit confirmed',
    channel: 'email',
    category: 'Confirmations',
    recipients: ['guest'],
    status: 'active',
    audience: 'Guest',
    description:
      'Confirms an approved stay with full property details (address, directions, WiFi, check-in, house rules) and attaches a calendar (.ics) file.',
    trigger:
      'A host approves a request, a visit auto-approves, a host creates an offline visit, or an approved visit is updated.',
    timing: 'Immediately',
    logTypes: ['visit_approved'],
    notificationPref: null,
    source: 'src/app/api/visits/[id]/route.ts',
    variants: [
      {
        label: 'With photo',
        subject: `Your stay at ${SAMPLE.propertyName} is confirmed`,
        element: (
          <VisitApprovedEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            checkInDate={SAMPLE.checkInDate}
            checkOutDate={SAMPLE.checkOutDate}
            partySize={SAMPLE.partySize}
            rooms={SAMPLE.rooms}
            address={SAMPLE.address}
            directions={SAMPLE.directions}
            wifiName={SAMPLE.wifiName}
            wifiPassword={SAMPLE.wifiPassword}
            checkIn={SAMPLE.checkIn}
            houseRules={SAMPLE.houseRules}
            coguestNote="Others staying during your dates: The Garcia family and others."
            profileUrl={SAMPLE.inviteUrl}
            heroImageUrl={SAMPLE.heroImageUrl}
            googleCalendarUrl={SAMPLE_GOOGLE_CAL_URL}
            outlookCalendarUrl={SAMPLE_OUTLOOK_CAL_URL}
          />
        ),
      },
      {
        label: 'No photo (branded)',
        subject: `Your stay at ${SAMPLE.propertyName} is confirmed`,
        element: (
          <VisitApprovedEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            checkInDate={SAMPLE.checkInDate}
            checkOutDate={SAMPLE.checkOutDate}
            partySize={SAMPLE.partySize}
            rooms={SAMPLE.rooms}
            address={SAMPLE.address}
            directions={SAMPLE.directions}
            wifiName={SAMPLE.wifiName}
            wifiPassword={SAMPLE.wifiPassword}
            checkIn={SAMPLE.checkIn}
            houseRules={SAMPLE.houseRules}
            coguestNote="Others staying during your dates: The Garcia family and others."
            profileUrl={SAMPLE.inviteUrl}
            googleCalendarUrl={SAMPLE_GOOGLE_CAL_URL}
            outlookCalendarUrl={SAMPLE_OUTLOOK_CAL_URL}
          />
        ),
      },
    ],
  },
  {
    id: 'visit-declined',
    name: 'Visit declined',
    channel: 'email',
    category: 'Confirmations',
    recipients: ['guest'],
    status: 'active',
    audience: 'Guest',
    description:
      'Lets a guest know their request was not approved, with an optional message from the host and a link to request again.',
    trigger: 'A host declines a stay request.',
    timing: 'Immediately',
    logTypes: ['visit_declined'],
    notificationPref: null,
    source: 'src/app/api/visits/[id]/route.ts',
    variants: [
      {
        label: 'Default',
        subject: `Stay request declined — ${SAMPLE.propertyName}`,
        element: (
          <VisitDeclinedEmail
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
    id: 'visit-cancelled',
    name: 'Visit cancelled',
    channel: 'email',
    category: 'Confirmations',
    recipients: ['guest', 'host'],
    status: 'active',
    audience: 'Host or guest (whoever did not cancel)',
    description:
      'Notifies the other party that a confirmed stay was cancelled. The wording changes depending on who cancelled.',
    trigger: 'A guest or host cancels a confirmed visit.',
    timing: 'Immediately',
    logTypes: ['visit_cancelled_guest', 'visit_cancelled_owner'],
    notificationPref: {
      key: 'visit_cancelled',
      label: 'Visit cancelled',
      enforced: true,
    },
    source: 'src/app/api/visits/[id]/route.ts',
    variants: [
      {
        label: 'To host (guest cancelled)',
        subject: `${SAMPLE.guestName} cancelled their stay`,
        element: (
          <VisitCancelledEmail
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
          <VisitCancelledEmail
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
    recipients: ['guest'],
    status: 'active',
    audience: 'Guest',
    description:
      'Reminds a guest about an upcoming stay. The 1-day reminder also includes check-in instructions.',
    trigger: 'A confirmed booking is exactly 7 days or 1 day before check-in.',
    timing: 'Scheduled — ~8am local, 7 days and 1 day before check-in',
    logTypes: ['reminder_7d', 'reminder_1d'],
    notificationPref: {
      key: 'guest_reminders',
      label: 'Stay reminders',
      enforced: true,
    },
    source: 'src/app/api/cron/reminders/route.ts',
    variants: [
      {
        label: '7 days before',
        subject: `One week until your stay at ${SAMPLE.propertyName}`,
        element: (
          <TripReminderEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            checkInDate={SAMPLE.checkInDate}
            checkOutDate={SAMPLE.checkOutDate}
            daysUntil={7}
            address={SAMPLE.address}
            wifiName={SAMPLE.wifiName}
            wifiPassword={SAMPLE.wifiPassword}
            profileUrl={SAMPLE.inviteUrl}
            heroImageUrl={SAMPLE.heroImageUrl}
            googleCalendarUrl={SAMPLE_GOOGLE_CAL_URL}
            outlookCalendarUrl={SAMPLE_OUTLOOK_CAL_URL}
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
            checkInDate={SAMPLE.checkInDate}
            checkOutDate={SAMPLE.checkOutDate}
            daysUntil={1}
            checkIn={SAMPLE.checkIn}
            address={SAMPLE.address}
            wifiName={SAMPLE.wifiName}
            wifiPassword={SAMPLE.wifiPassword}
            profileUrl={SAMPLE.inviteUrl}
            heroImageUrl={SAMPLE.heroImageUrl}
            googleCalendarUrl={SAMPLE_GOOGLE_CAL_URL}
            outlookCalendarUrl={SAMPLE_OUTLOOK_CAL_URL}
          />
        ),
      },
      {
        label: 'No photo (branded)',
        subject: `One week until your stay at ${SAMPLE.propertyName}`,
        element: (
          <TripReminderEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            checkInDate={SAMPLE.checkInDate}
            checkOutDate={SAMPLE.checkOutDate}
            daysUntil={7}
            address={SAMPLE.address}
            wifiName={SAMPLE.wifiName}
            wifiPassword={SAMPLE.wifiPassword}
            profileUrl={SAMPLE.inviteUrl}
            googleCalendarUrl={SAMPLE_GOOGLE_CAL_URL}
            outlookCalendarUrl={SAMPLE_OUTLOOK_CAL_URL}
          />
        ),
      },
    ],
  },
  {
    id: 'arrival-welcome',
    name: 'Arrival welcome',
    channel: 'email',
    category: 'Reminders',
    recipients: ['guest'],
    status: 'active',
    audience: 'Guest',
    description:
      'A day-of welcome with everything needed to get in: check-in instructions, address, directions, and WiFi.',
    trigger: 'A confirmed booking reaches its check-in date.',
    timing: 'Scheduled — ~8am local on the day of check-in',
    logTypes: ['arrival_welcome'],
    notificationPref: {
      key: 'guest_reminders',
      label: 'Stay reminders',
      enforced: true,
    },
    source: 'src/app/api/cron/reminders/route.ts',
    variants: [
      {
        label: 'With photo',
        subject: `Today's the day — welcome to ${SAMPLE.propertyName}`,
        element: (
          <ArrivalWelcomeEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            checkIn={SAMPLE.checkIn}
            address={SAMPLE.address}
            directions={SAMPLE.directions}
            wifiName={SAMPLE.wifiName}
            wifiPassword={SAMPLE.wifiPassword}
            profileUrl={SAMPLE.inviteUrl}
            heroImageUrl={SAMPLE.heroImageUrl}
          />
        ),
      },
      {
        label: 'No photo (branded)',
        subject: `Today's the day — welcome to ${SAMPLE.propertyName}`,
        element: (
          <ArrivalWelcomeEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            checkIn={SAMPLE.checkIn}
            address={SAMPLE.address}
            directions={SAMPLE.directions}
            wifiName={SAMPLE.wifiName}
            wifiPassword={SAMPLE.wifiPassword}
            profileUrl={SAMPLE.inviteUrl}
          />
        ),
      },
    ],
  },
  {
    id: 'checkout-instructions',
    name: 'Checkout instructions',
    channel: 'email',
    category: 'Reminders',
    recipients: ['guest'],
    status: 'active',
    audience: 'Guest',
    description:
      'Proactively sends checkout steps and a house-rules reminder on the morning the guest leaves.',
    trigger: 'A confirmed booking reaches its check-out date.',
    timing: 'Scheduled — ~8am local on the day of checkout',
    logTypes: ['checkout_instructions'],
    notificationPref: {
      key: 'guest_reminders',
      label: 'Stay reminders',
      enforced: true,
    },
    source: 'src/app/api/cron/reminders/route.ts',
    variants: [
      {
        label: 'Default',
        subject: `Checkout details for ${SAMPLE.propertyName}`,
        element: (
          <CheckoutInstructionsEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            checkoutTime={SAMPLE.checkoutTime}
            checkoutInstructions={SAMPLE.checkoutInstructions}
            houseRules={SAMPLE.houseRules}
          />
        ),
      },
    ],
  },
  {
    id: 'post-stay',
    name: 'Post-stay thank-you',
    channel: 'email',
    category: 'Reminders',
    recipients: ['guest'],
    status: 'active',
    audience: 'Guest',
    description:
      'A warm thank-you the day after a guest checks out, with a link back to the house.',
    trigger: 'The day after a confirmed visit\u2019s check-out date.',
    timing: 'Scheduled — ~8am local the day after checkout',
    logTypes: ['post_stay'],
    notificationPref: {
      key: 'guest_reminders',
      label: 'Stay reminders',
      enforced: true,
    },
    source: 'src/app/api/cron/reminders/route.ts',
    variants: [
      {
        label: 'Default',
        subject: `Thanks for staying at ${SAMPLE.propertyName}`,
        element: (
          <PostStayThankYouEmail
            guestName={SAMPLE.guestName}
            propertyName={SAMPLE.propertyName}
            hostName={SAMPLE.ownerName}
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
    recipients: ['host'],
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
      enforced: true,
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
  {
    id: 'product-updates',
    name: 'Product updates',
    channel: 'email',
    category: 'Marketing',
    recipients: ['host'],
    status: 'planned',
    audience: 'Hosts (anyone who owns a home)',
    description:
      'Occasional marketing email about new Gracious features. The only non-transactional email — subscribed by default once a host adds a home, opt-out anytime. No broadcast tooling is built yet.',
    trigger: 'Sent manually when there\u2019s something worth sharing.',
    timing: 'Ad hoc',
    logTypes: [],
    notificationPref: {
      key: 'product_updates',
      label: 'Product updates',
      enforced: true,
    },
    source: 'Not built yet',
    variants: [
      {
        label: 'Default',
        subject: "What's new in Gracious",
        element: (
          <ProductUpdateEmail
            hostName={SAMPLE.ownerName}
            headline="Room-level photo galleries are here"
            body="You can now add a photo gallery to each room, so guests see exactly where they'll be staying. Head to any home to try it out."
            ctaLabel="See what's new"
            ctaUrl={SAMPLE.dashboardUrl}
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

// ---------------------------------------------------------------------------
// Journeys — the ordered sequence of emails a guest (and host) experiences,
// described in their own words with a strong sense of timing. Steps link to a
// real registered email when one exists; steps we envision but haven't built
// yet are flagged `planned` so the timeline stays honest about what sends today.
// ---------------------------------------------------------------------------

export interface JourneyStep {
  /** How the recipient would perceive this moment. */
  title: string;
  /** Plain-language timing — a strong suggestion of when it arrives. */
  when: string;
  /** Optional context, especially for planned steps. */
  description?: string;
  /** Registered email message id(s) this step maps to, if built. */
  messageIds?: string[];
  /** Envisioned but not yet implemented. */
  planned?: boolean;
}

export const GUEST_JOURNEY: JourneyStep[] = [
  {
    title: "You've been invited",
    when: 'As soon as a host invites you',
    messageIds: ['invitation-sent'],
  },
  {
    title: "A nudge if you haven't replied",
    when: 'Once a day for up to three days after your invite',
    description:
      'Gentle reminders that stop the moment you pick dates — the third is a final "last reminder".',
    messageIds: ['invite-reminder'],
  },
  {
    title: 'Your sign-in link',
    when: 'When you open your invite and sign in',
    messageIds: ['auth-magic-link'],
  },
  {
    title: 'Your dates have been requested',
    when: 'Moments after you submit your dates',
    description:
      'Only when the invitation requires host approval — instant visits skip straight to the confirmation.',
    messageIds: ['request-received'],
  },
  {
    title: 'Your dates were approved — or declined',
    when: 'When the host responds to your request',
    messageIds: ['visit-approved', 'visit-declined'],
  },
  {
    title: 'Your visit is coming up',
    when: 'About a week before check-in',
    messageIds: ['trip-reminder'],
  },
  {
    title: 'Your visit is tomorrow',
    when: 'The day before check-in',
    messageIds: ['trip-reminder'],
  },
  {
    title: "Welcome — here's how to get in",
    when: 'The morning of check-in',
    messageIds: ['arrival-welcome'],
  },
  {
    title: 'Time to head out',
    when: 'The morning you leave',
    messageIds: ['checkout-instructions'],
  },
  {
    title: 'Thanks for visiting',
    when: 'The morning after you check out',
    messageIds: ['post-stay'],
  },
];

export const HOST_JOURNEY: JourneyStep[] = [
  {
    title: 'An invited guest went quiet',
    when: 'Four days after an invite with no response',
    description:
      "After we've nudged the guest a few times, we let you know so you can share the link directly.",
    messageIds: ['invite-stalled'],
  },
  {
    title: 'A guest requested a stay',
    when: 'As soon as a guest submits their dates',
    description: 'When the invitation requires your approval.',
    messageIds: ['stay-requested'],
  },
  {
    title: 'A guest booked a stay',
    when: 'The moment an instant visit lands on your calendar',
    description:
      'When the invitation doesn\u2019t require approval — informational, nothing to act on.',
    messageIds: ['stay-confirmed'],
  },
  {
    title: 'A stay was cancelled',
    when: 'If a guest cancels a confirmed visit',
    messageIds: ['visit-cancelled'],
  },
];

// Account/auth touchpoints. Not a chronological journey like a booking — these
// fire whenever the matching auth event happens — but listing them as a short
// flow keeps the "what arrives when" framing consistent.
export const ACCOUNT_JOURNEY: JourneyStep[] = [
  {
    title: 'Confirm your email',
    when: 'Right after you sign up',
    messageIds: ['auth-confirm-signup'],
  },
  {
    title: 'Your sign-in link',
    when: 'When you request a passwordless sign-in',
    messageIds: ['auth-magic-link'],
  },
  {
    title: 'Reset your password',
    when: 'When you ask to reset your password',
    messageIds: ['auth-recovery'],
  },
];

/** All messages addressed to a given recipient, in registry order. */
export function messagesForRecipient(
  recipient: MessageRecipient
): AutomatedMessage[] {
  return AUTOMATED_MESSAGES.filter((m) => m.recipients.includes(recipient));
}
