import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildAuthenticatedInviteUrl } from '@/lib/auth-links';
import { sendEmail } from '@/lib/email/send';
import SignInLinkEmail from '../../../../../emails/sign-in-link';

/**
 * Emails an invited guest a one-click, token_hash sign-in link (→ /auth/confirm
 * → /invite/{token}). The recipient is always the invitation's own guest_email,
 * so possession of the token can't be used to send a link to an arbitrary
 * address. Used by the in-page "Send sign-in link" button.
 */
export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (typeof token !== 'string' || !token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: invitation } = await admin
      .from('invitations')
      .select('guest_email, token, property:properties(name)')
      .eq('token', token)
      .single();

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invitation not found' },
        { status: 404 }
      );
    }

    const signInUrl = await buildAuthenticatedInviteUrl(
      admin,
      invitation.guest_email,
      invitation.token
    );

    const propertyRaw = invitation.property;
    const property = (
      Array.isArray(propertyRaw) ? propertyRaw[0] : propertyRaw
    ) as { name: string } | null;

    await sendEmail({
      to: invitation.guest_email,
      subject: `Your sign-in link for ${property?.name ?? 'your visit'}`,
      react: SignInLinkEmail({
        propertyName: property?.name ?? 'your visit',
        signInUrl,
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: 'Could not send sign-in link' },
      { status: 500 }
    );
  }
}
