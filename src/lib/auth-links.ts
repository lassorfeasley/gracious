import 'server-only';
import type { createAdminClient } from '@/lib/supabase/admin';
import { inviteUrl } from '@/lib/invitations';
import { appUrl } from '@/lib/env';

type AdminClient = ReturnType<typeof createAdminClient>;

/**
 * Builds a one-click sign-in link for an invited guest. Clicking it verifies a
 * token_hash via /auth/confirm and drops them on the booking page already
 * authenticated — no password and no second email — for both new and existing
 * accounts. Falls back to the plain (unauthenticated) invite link if anything
 * goes wrong.
 *
 * The token_hash flow is cross-device safe (unlike the PKCE `?code=` flow),
 * because verification doesn't depend on a locally stored code verifier.
 */
export async function buildAuthenticatedInviteUrl(
  admin: AdminClient,
  email: string,
  token: string
): Promise<string> {
  const plain = inviteUrl(token);
  const base = appUrl();
  const next = `/invite/${token}`;
  const normalizedEmail = email.toLowerCase();

  try {
    // generateLink({ type: 'magiclink' }) requires the user to already exist,
    // so create a passwordless guest account first if there isn't one.
    const { data: existing } = await admin
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (!existing) {
      const { error: createError } = await admin.auth.admin.createUser({
        email: normalizedEmail,
        email_confirm: true,
        user_metadata: { role: 'guest' },
      });
      // Ignore "already registered" races; any other failure falls through.
      if (createError && !/registered|exists/i.test(createError.message)) {
        return plain;
      }
    }

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
      options: { redirectTo: `${base}/auth/confirm` },
    });

    const tokenHash = data?.properties?.hashed_token;
    if (error || !tokenHash) return plain;

    const url = new URL(`${base}/auth/confirm`);
    url.searchParams.set('token_hash', tokenHash);
    url.searchParams.set('type', 'magiclink');
    url.searchParams.set('next', next);
    return url.toString();
  } catch {
    return plain;
  }
}
