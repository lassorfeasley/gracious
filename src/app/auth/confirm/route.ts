import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

/**
 * Verifies a token_hash magic link (e.g. the one embedded in invitation
 * emails) and establishes a session, then sends the guest straight to their
 * destination. Unlike the PKCE `?code=` flow in /auth/callback, the token_hash
 * flow works across devices/browsers because it doesn't rely on a locally
 * stored code verifier.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const nextParam = searchParams.get('next') ?? '/my-trips';
  const next = nextParam.startsWith('/') ? nextParam : `/${nextParam}`;

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If the link is stale/invalid but points at an invitation, send the guest to
  // the booking page where they can request a fresh sign-in link, rather than
  // the host-oriented login form.
  const fallback = next.startsWith('/invite/') ? next : '/login?error=auth';
  return NextResponse.redirect(`${origin}${fallback}`);
}
