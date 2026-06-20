import { differenceInCalendarDays } from 'date-fns';

/**
 * The invite reminder drip. The original invitation email is "try 1" (day 0);
 * we then nudge the guest once per day on days 1, 2, and 3 — four total touches.
 * If they still haven't responded after the final nudge, the invitation is
 * considered stalled and we escalate to the host (day 4+).
 *
 * All of this stops the moment the invitation leaves `pending` (the guest booked
 * or requested, or the host revoked it) or it expires.
 */
export const INVITE_REMINDER_STEPS = [1, 2, 3] as const;
export type InviteReminderStep = (typeof INVITE_REMINDER_STEPS)[number];

/** Whole days after the invite was sent at which the host is nudged instead. */
export const INVITE_STALL_DAY = 4;

/** The final reminder step (used for "last call" copy). */
export const FINAL_INVITE_REMINDER_STEP: InviteReminderStep = 3;

/** notifications_log type for a given guest reminder step. */
export function inviteReminderLogType(step: InviteReminderStep): string {
  return `invite_reminder_${step}`;
}

/** notifications_log type written once per invitation when the host is nudged. */
export const INVITE_HOST_NUDGE_LOG_TYPE = 'invite_host_nudge';

/**
 * Which guest reminder is due for an invite of a given age, or null if none.
 * Evaluated in whole calendar days so the drip lands "once per day" rather than
 * on an exact 24h clock — the right behavior for a daily cron.
 */
export function dueInviteReminderStep(
  createdAt: string | Date,
  now: Date = new Date()
): InviteReminderStep | null {
  const elapsed = differenceInCalendarDays(now, new Date(createdAt));
  return (INVITE_REMINDER_STEPS as readonly number[]).includes(elapsed)
    ? (elapsed as InviteReminderStep)
    : null;
}

/** Whole days elapsed since the invite was sent. */
export function inviteAgeInDays(
  createdAt: string | Date,
  now: Date = new Date()
): number {
  return differenceInCalendarDays(now, new Date(createdAt));
}

/**
 * True when an invite has gone quiet long enough to surface to the host (the
 * drip is exhausted and they still haven't responded). Expiry/status gating is
 * the caller's responsibility; this is purely the age test.
 */
export function isInviteStalledByAge(
  createdAt: string | Date,
  now: Date = new Date()
): boolean {
  return inviteAgeInDays(createdAt, now) >= INVITE_STALL_DAY;
}
