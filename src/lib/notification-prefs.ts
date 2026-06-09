import type { NotificationPrefs } from '@/types/database';

/**
 * Every email is transactional except product updates. Some transactional
 * categories are mandatory (auth, invitations, booking confirmations) and have
 * no flag here — they always send. The flags below are the opt-out categories.
 */
export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  booking_requests: true,
  booking_cancelled: true,
  invitation_expiring: true,
  guest_reminders: true,
  product_updates: true,
};

/** Fills any missing keys with their default (opted-in) value. */
export function normalizePrefs(
  prefs: Partial<NotificationPrefs> | null | undefined
): NotificationPrefs {
  return { ...DEFAULT_NOTIFICATION_PREFS, ...(prefs ?? {}) };
}

/** Whether the recipient still wants emails for the given flag (default yes). */
export function wantsEmail(
  prefs: Partial<NotificationPrefs> | null | undefined,
  key: keyof NotificationPrefs
): boolean {
  return prefs?.[key] !== false;
}

/**
 * Public unsubscribe groupings. A single link can opt someone out of a whole
 * group (e.g. all host activity) without exposing the granular flags.
 */
export type UnsubscribeCategory =
  | 'guest_reminders'
  | 'host_activity'
  | 'product_updates';

export const CATEGORY_FLAGS: Record<
  UnsubscribeCategory,
  (keyof NotificationPrefs)[]
> = {
  guest_reminders: ['guest_reminders'],
  host_activity: ['booking_requests', 'booking_cancelled', 'invitation_expiring'],
  product_updates: ['product_updates'],
};

export const CATEGORY_LABELS: Record<UnsubscribeCategory, string> = {
  guest_reminders: 'Stay reminders',
  host_activity: 'Host activity notifications',
  product_updates: 'Product updates',
};

export function isUnsubscribeCategory(
  value: string
): value is UnsubscribeCategory {
  return value in CATEGORY_FLAGS;
}

/** Returns a copy of prefs with every flag in a category set to subscribed. */
export function applyCategorySubscription(
  prefs: NotificationPrefs,
  category: UnsubscribeCategory,
  subscribed: boolean
): NotificationPrefs {
  const next = { ...prefs };
  for (const flag of CATEGORY_FLAGS[category]) {
    next[flag] = subscribed;
  }
  return next;
}

/** True if the recipient is still subscribed to any flag in the category. */
export function isSubscribedToCategory(
  prefs: NotificationPrefs,
  category: UnsubscribeCategory
): boolean {
  return CATEGORY_FLAGS[category].some((flag) => prefs[flag] !== false);
}
