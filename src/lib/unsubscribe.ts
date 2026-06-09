import crypto from 'crypto';
import { appUrl } from '@/lib/env';
import {
  isUnsubscribeCategory,
  type UnsubscribeCategory,
} from '@/lib/notification-prefs';

// Signing secret for unsubscribe links. A dedicated secret is preferred, but we
// fall back to the service role key so the feature works without extra config.
function signingSecret(): string {
  return (
    process.env.EMAIL_UNSUBSCRIBE_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'dev-unsubscribe-secret'
  );
}

function sign(data: string): string {
  return crypto.createHmac('sha256', signingSecret()).update(data).digest('base64url');
}

/** Builds a tamper-proof token identifying a user + unsubscribe category. */
export function makeUnsubscribeToken(
  userId: string,
  category: UnsubscribeCategory
): string {
  const payload = `${userId}:${category}`;
  const token = `${payload}:${sign(payload)}`;
  return Buffer.from(token).toString('base64url');
}

export function parseUnsubscribeToken(
  token: string
): { userId: string; category: UnsubscribeCategory } | null {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const lastSep = decoded.lastIndexOf(':');
    if (lastSep === -1) return null;

    const payload = decoded.slice(0, lastSep);
    const signature = decoded.slice(lastSep + 1);
    const [userId, category] = payload.split(':');
    if (!userId || !category || !signature) return null;

    const expected = sign(payload);
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    if (!isUnsubscribeCategory(category)) return null;

    return { userId, category };
  } catch {
    return null;
  }
}

/** Human-facing page where someone can manage/confirm the opt-out. */
export function unsubscribePageUrl(
  userId: string,
  category: UnsubscribeCategory
): string {
  return `${appUrl()}/unsubscribe?token=${makeUnsubscribeToken(userId, category)}`;
}

/**
 * Headers for one-click unsubscribe (RFC 8058). Mail clients POST to the URL;
 * GET prefetching by scanners won't trigger an opt-out.
 */
export function listUnsubscribeHeaders(
  userId: string,
  category: UnsubscribeCategory
): Record<string, string> {
  const apiUrl = `${appUrl()}/api/unsubscribe?token=${makeUnsubscribeToken(userId, category)}`;
  return {
    'List-Unsubscribe': `<${apiUrl}>`,
    'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
  };
}
