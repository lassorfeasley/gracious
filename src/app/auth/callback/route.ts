import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/my-trips';
  const token = searchParams.get('token');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const redirectTo = token ? `/invite/${token}` : next;
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // For invited guests, fall back to the booking page (where they can request a
  // fresh sign-in link) instead of the host-oriented login form.
  const fallback = token ? `/invite/${token}` : '/login?error=auth';
  return NextResponse.redirect(`${origin}${fallback}`);
}
