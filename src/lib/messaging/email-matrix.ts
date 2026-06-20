import type { NotificationPrefs } from '@/types/database';
import { AUTOMATED_MESSAGES } from '@/lib/messaging/registry';

/**
 * The email assertion matrix: one row per *actual email that can leave the
 * system*, expanded to the granularity a test (or a careful human) needs.
 *
 * This is intentionally finer-grained than `AUTOMATED_MESSAGES` in
 * `registry.tsx`. The registry is the admin-facing catalog — it lists each
 * template once and buckets recipients coarsely (guest / host / account). This
 * matrix instead captures the real send-time behavior that the registry
 * flattens:
 *
 *   - Fan-out: a single event (e.g. a new request) emails the owner *and* every
 *     manager, each gated independently.
 *   - Actor-dependent routing: a cancellation goes to the host or the guest
 *     depending on who cancelled, with different gating for each copy.
 *   - Hard preconditions: most guest emails early-return unless `notify_guest`
 *     and a guest email are present; a decline additionally requires an
 *     invitation to exist.
 *
 * Each row points back at a registry message via `registryId`, and
 * `assertMatrixMatchesRegistry()` cross-checks the two so the docs and the
 * matrix can't silently drift. When automated tests land, they can iterate this
 * array directly to assert "given event X with state Y, exactly these emails go
 * out, to these recipients, unless suppressed."
 */

/** Who actually receives a given email (one concrete recipient per row). */
export type EmailRecipientRole =
  | 'guest'
  | 'property_owner'
  | 'property_managers'
  | 'account';

/** How (or whether) the recipient can suppress this email. */
export type EmailGating =
  | { kind: 'mandatory' }
  | { kind: 'preference'; pref: keyof NotificationPrefs };

export interface EmailMatrixEntry {
  /** Plain-language event that triggers the send. */
  event: string;
  /** The function (or path) responsible for sending. */
  fn: string;
  /** `notifications_log` type written, or null when the send isn't logged. */
  logType: string | null;
  /** The concrete recipient of this email. */
  recipient: EmailRecipientRole;
  /** Whether/how the recipient can opt out. */
  gating: EmailGating;
  /**
   * Hard preconditions that short-circuit the send (early return), beyond the
   * gating preference. Expressed as field-level expectations on the booking.
   */
  preconditions: string[];
  /** The `AUTOMATED_MESSAGES` id this email corresponds to. */
  registryId: string;
}

const MANDATORY: EmailGating = { kind: 'mandatory' };
const pref = (p: keyof NotificationPrefs): EmailGating => ({
  kind: 'preference',
  pref: p,
});

export const EMAIL_MATRIX: EmailMatrixEntry[] = [
  // --- Invitations ---------------------------------------------------------
  {
    event: 'Host sends an invitation',
    fn: 'notifyInvitationSent',
    logType: 'invitation_sent',
    recipient: 'guest',
    gating: MANDATORY,
    preconditions: ['invitation exists'],
    registryId: 'invitation-sent',
  },
  {
    event: 'Cron: pending invitation is 1/2/3 days old (guest drip)',
    fn: 'notifyInviteReminder',
    logType: 'invite_reminder_1',
    recipient: 'guest',
    gating: MANDATORY,
    preconditions: ['invitation status is pending', 'invitation not expired'],
    registryId: 'invite-reminder',
  },
  {
    event: 'Cron: pending invitation is 1/2/3 days old (guest drip)',
    fn: 'notifyInviteReminder',
    logType: 'invite_reminder_2',
    recipient: 'guest',
    gating: MANDATORY,
    preconditions: ['invitation status is pending', 'invitation not expired'],
    registryId: 'invite-reminder',
  },
  {
    event: 'Cron: pending invitation is 1/2/3 days old (guest drip)',
    fn: 'notifyInviteReminder',
    logType: 'invite_reminder_3',
    recipient: 'guest',
    gating: MANDATORY,
    preconditions: ['invitation status is pending', 'invitation not expired'],
    registryId: 'invite-reminder',
  },
  {
    event: 'Cron: pending invitation still unanswered 4 days after sending',
    fn: 'notifyInviteStalled',
    logType: 'invite_host_nudge',
    recipient: 'property_owner',
    // Gated upstream in the reminders cron, not inside the notify function.
    gating: pref('invitation_stalled'),
    preconditions: ['invitation status is pending', 'invitation not expired'],
    registryId: 'invite-stalled',
  },

  // --- New stay needing approval ------------------------------------------
  {
    event: 'Guest submits a stay request that needs approval',
    fn: 'notifyStayRequested',
    logType: 'stay_requested',
    recipient: 'property_owner',
    gating: pref('visit_requests'),
    preconditions: [],
    registryId: 'stay-requested',
  },
  {
    event: 'Guest submits a stay request that needs approval',
    fn: 'notifyStayRequested',
    logType: 'stay_requested',
    recipient: 'property_managers',
    gating: pref('visit_requests'),
    preconditions: [],
    registryId: 'stay-requested',
  },
  {
    event: 'Guest submits a stay request that needs approval',
    fn: 'notifyRequestReceived',
    logType: 'request_received',
    recipient: 'guest',
    gating: MANDATORY,
    preconditions: ['notify_guest', 'guest.email'],
    registryId: 'request-received',
  },

  // --- New stay auto-approved (pre-approved invite / open availability) ----
  {
    event: 'Stay is booked on the auto-approve path',
    fn: 'notifyStayConfirmed',
    logType: 'stay_booked',
    recipient: 'property_owner',
    gating: pref('visit_requests'),
    preconditions: [],
    registryId: 'stay-confirmed',
  },
  {
    event: 'Stay is booked on the auto-approve path',
    fn: 'notifyStayConfirmed',
    logType: 'stay_booked',
    recipient: 'property_managers',
    gating: pref('visit_requests'),
    preconditions: [],
    registryId: 'stay-confirmed',
  },

  // --- Approval (manual approve, auto-approve, host offline, edit) ---------
  {
    event:
      'Stay becomes approved (host approves, auto-approve, host offline visit, or approved-stay edit)',
    fn: 'notifyVisitApproved',
    logType: 'visit_approved',
    recipient: 'guest',
    gating: MANDATORY,
    preconditions: ['notify_guest', 'guest.email', 'includes .ics attachment'],
    registryId: 'visit-approved',
  },

  // --- Decline -------------------------------------------------------------
  {
    event: 'Host declines a stay request',
    fn: 'notifyVisitDeclined',
    logType: 'visit_declined',
    recipient: 'guest',
    // NOTE: decline does NOT gate on notify_guest; it requires an invitation.
    gating: MANDATORY,
    preconditions: ['guest.email', 'invitation exists'],
    registryId: 'visit-declined',
  },

  // --- Cancellation (routing + gating depend on who cancelled) ------------
  {
    event: 'Guest cancels their stay',
    fn: 'notifyVisitCancelled',
    logType: 'visit_cancelled_guest',
    recipient: 'property_owner',
    gating: pref('visit_cancelled'),
    preconditions: [],
    registryId: 'visit-cancelled',
  },
  {
    event: 'Host cancels the stay',
    fn: 'notifyVisitCancelled',
    logType: 'visit_cancelled_owner',
    recipient: 'guest',
    gating: MANDATORY,
    preconditions: ['notify_guest', 'guest.email'],
    registryId: 'visit-cancelled',
  },

  // --- Lifecycle reminders (cron, gated by guest_reminders) ---------------
  {
    event: 'Cron: ~7 days before check-in',
    fn: 'notifyTripReminder',
    logType: 'reminder_7d',
    recipient: 'guest',
    gating: pref('guest_reminders'),
    preconditions: ['notify_guest', 'guest.email'],
    registryId: 'trip-reminder',
  },
  {
    event: 'Cron: ~1 day before check-in',
    fn: 'notifyTripReminder',
    logType: 'reminder_1d',
    recipient: 'guest',
    gating: pref('guest_reminders'),
    preconditions: ['notify_guest', 'guest.email'],
    registryId: 'trip-reminder',
  },
  {
    event: 'Cron: morning of check-in',
    fn: 'notifyArrivalWelcome',
    logType: 'arrival_welcome',
    recipient: 'guest',
    gating: pref('guest_reminders'),
    preconditions: ['notify_guest', 'guest.email'],
    registryId: 'arrival-welcome',
  },
  {
    event: 'Cron: morning of check-out',
    fn: 'notifyCheckoutInstructions',
    logType: 'checkout_instructions',
    recipient: 'guest',
    gating: pref('guest_reminders'),
    preconditions: ['notify_guest', 'guest.email'],
    registryId: 'checkout-instructions',
  },
  {
    event: 'Cron: morning after check-out',
    fn: 'notifyPostStay',
    logType: 'post_stay',
    recipient: 'guest',
    gating: pref('guest_reminders'),
    preconditions: ['notify_guest', 'guest.email'],
    registryId: 'post-stay',
  },

  // --- Host digest ---------------------------------------------------------
  {
    event: 'Cron: invitations expiring within 48h',
    fn: 'notifyInvitationsExpiring',
    logType: null,
    recipient: 'property_owner',
    // Gated upstream in the reminders cron, not inside the notify function.
    gating: pref('invitation_expiring'),
    preconditions: ['has invitations expiring in 48h'],
    registryId: 'invitation-expiring',
  },
];

/**
 * Cross-checks the matrix against the registry so neither can drift unnoticed.
 * Returns a list of human-readable problems; an empty array means they agree.
 * Call this from a unit test (or a dev assertion) once a test runner exists.
 */
export function assertMatrixMatchesRegistry(): string[] {
  const problems: string[] = [];
  const byId = new Map(AUTOMATED_MESSAGES.map((m) => [m.id, m]));

  for (const entry of EMAIL_MATRIX) {
    const message = byId.get(entry.registryId);
    if (!message) {
      problems.push(
        `Matrix row "${entry.event}" references unknown registry id "${entry.registryId}".`
      );
      continue;
    }
    if (message.status !== 'active') {
      problems.push(
        `Matrix row "${entry.event}" maps to registry id "${entry.registryId}" which is not active (status: ${message.status}).`
      );
    }
    if (entry.logType && !message.logTypes.includes(entry.logType)) {
      problems.push(
        `Matrix logType "${entry.logType}" is not declared on registry id "${entry.registryId}" (has: ${message.logTypes.join(', ') || 'none'}).`
      );
    }
  }

  // Every active, logged registry message should be represented by at least one
  // matrix row, so newly added emails don't escape the assertion surface.
  for (const message of AUTOMATED_MESSAGES) {
    if (message.status !== 'active') continue;
    if (message.logTypes.length === 0) continue; // auth / un-logged sends
    const covered = EMAIL_MATRIX.some(
      (entry) => entry.registryId === message.id
    );
    if (!covered) {
      problems.push(
        `Active registry message "${message.id}" (logs: ${message.logTypes.join(', ')}) has no email-matrix row.`
      );
    }
  }

  return problems;
}
