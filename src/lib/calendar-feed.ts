import crypto from 'crypto';
import { appUrl } from '@/lib/env';

/**
 * Signing + URL helpers for property calendar feeds. A feed URL is a long-lived
 * subscription link that calendar apps poll without sending cookies, so the
 * token itself must be the credential: an unguessable, tamper-proof handle that
 * maps back to a single property. Mirrors the unsubscribe-link approach.
 */

// Dedicated secret preferred; fall back to the service role key so the feature
// works without extra config.
function signingSecret(): string {
  return (
    process.env.CALENDAR_FEED_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'dev-calendar-feed-secret'
  );
}

function sign(data: string): string {
  return crypto
    .createHmac('sha256', signingSecret())
    .update(data)
    .digest('base64url');
}

/**
 * What a feed token resolves to: a single property, or a host's whole account
 * (every home they own or co-manage), aggregated into one calendar.
 */
export type CalendarFeedTarget =
  | { kind: 'property'; propertyId: string }
  | { kind: 'account'; userId: string };

function encodeToken(payload: string): string {
  const token = `${payload}:${sign(payload)}`;
  return Buffer.from(token).toString('base64url');
}

/** Tamper-proof token identifying a property feed. */
export function makeCalendarFeedToken(propertyId: string): string {
  return encodeToken(`property:${propertyId}`);
}

/** Tamper-proof token identifying a host's all-homes feed. */
export function makeAccountCalendarFeedToken(userId: string): string {
  return encodeToken(`account:${userId}`);
}

export function parseCalendarFeedToken(
  token: string
): CalendarFeedTarget | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const lastSep = decoded.lastIndexOf(':');
    if (lastSep === -1) return null;

    const payload = decoded.slice(0, lastSep);
    const signature = decoded.slice(lastSep + 1);
    const [kind, id] = payload.split(':');
    if (!kind || !id || !signature) return null;

    const expected = sign(payload);
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

    if (kind === 'property') return { kind: 'property', propertyId: id };
    if (kind === 'account') return { kind: 'account', userId: id };
    return null;
  } catch {
    return null;
  }
}

/** Absolute https URL of a property's calendar feed. */
export function propertyCalendarFeedUrl(propertyId: string): string {
  return `${appUrl()}/api/calendar/${makeCalendarFeedToken(propertyId)}.ics`;
}

/** Absolute https URL of a host's combined all-homes calendar feed. */
export function accountCalendarFeedUrl(userId: string): string {
  return `${appUrl()}/api/calendar/${makeAccountCalendarFeedToken(userId)}.ics`;
}
