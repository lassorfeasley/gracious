import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseUnsubscribeToken } from '@/lib/unsubscribe';
import {
  applyCategorySubscription,
  normalizePrefs,
} from '@/lib/notification-prefs';

export const runtime = 'nodejs';

/**
 * Applies an opt-out (or re-subscribe) for the user + category encoded in the
 * signed token. Handles both the RFC 8058 one-click POST from mail clients and
 * calls from our own /unsubscribe page. We only mutate on POST, never GET, so
 * link-prefetching scanners can't accidentally unsubscribe anyone.
 */
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  const parsed = parseUnsubscribeToken(token);
  if (!parsed) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
  }

  // Default action is to unsubscribe. Our page can pass { subscribed: true } to
  // re-subscribe; one-click clients send a form body we can safely ignore.
  let subscribed = false;
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      const body = await request.json();
      if (typeof body?.subscribed === 'boolean') subscribed = body.subscribed;
    }
  } catch {
    // Non-JSON body (e.g. one-click form post) — keep the unsubscribe default.
  }

  const admin = createAdminClient();
  const { data: user } = await admin
    .from('users')
    .select('notification_prefs')
    .eq('id', parsed.userId)
    .maybeSingle();

  if (!user) {
    return NextResponse.json({ error: 'Unknown recipient' }, { status: 404 });
  }

  const next = applyCategorySubscription(
    normalizePrefs(user.notification_prefs),
    parsed.category,
    subscribed
  );

  const { error } = await admin
    .from('users')
    .update({ notification_prefs: next })
    .eq('id', parsed.userId);

  if (error) {
    return NextResponse.json({ error: 'Could not update preferences' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, category: parsed.category, subscribed });
}
