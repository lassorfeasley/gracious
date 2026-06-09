import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'standardwebhooks';
import { sendEmail, appUrl } from '@/lib/email/send';
import AuthConfirmSignupEmail from '../../../../../emails/auth-confirm-signup';
import AuthMagicLinkEmail from '../../../../../emails/auth-magic-link';
import AuthRecoveryEmail from '../../../../../emails/auth-recovery';

// Node runtime: signature verification + email rendering need full Node APIs.
export const runtime = 'nodejs';

interface SupabaseEmailHookPayload {
  user: { email: string };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

/**
 * Builds the link that completes the auth action. It points at our own
 * /auth/confirm route (token_hash flow) so the styling and post-verify
 * redirect stay under our control.
 */
function buildActionUrl(
  emailData: SupabaseEmailHookPayload['email_data']
): string {
  const params = new URLSearchParams({
    token_hash: emailData.token_hash,
    type: emailData.email_action_type,
    next: emailData.redirect_to || '/dashboard',
  });
  return `${appUrl()}/auth/confirm?${params.toString()}`;
}

function verifyPayload(body: string, request: NextRequest): SupabaseEmailHookPayload {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;

  // In local dev without a configured secret, accept the payload as-is so the
  // hook can be exercised against the Supabase CLI. Never skip in production.
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SEND_EMAIL_HOOK_SECRET is not configured');
    }
    console.warn('[auth-hook] SEND_EMAIL_HOOK_SECRET not set — skipping signature verification (dev only)');
    return JSON.parse(body) as SupabaseEmailHookPayload;
  }

  const wh = new Webhook(secret.replace('v1,whsec_', ''));
  return wh.verify(body, {
    'webhook-id': request.headers.get('webhook-id') ?? '',
    'webhook-timestamp': request.headers.get('webhook-timestamp') ?? '',
    'webhook-signature': request.headers.get('webhook-signature') ?? '',
  }) as SupabaseEmailHookPayload;
}

export async function POST(request: NextRequest) {
  const body = await request.text();

  let payload: SupabaseEmailHookPayload;
  try {
    payload = verifyPayload(body, request);
  } catch (err) {
    console.error('[auth-hook] signature verification failed:', err);
    return NextResponse.json(
      { error: { http_code: 401, message: 'Invalid signature' } },
      { status: 401 }
    );
  }

  try {
    const { user, email_data: emailData } = payload;
    const actionUrl = buildActionUrl(emailData);
    const token = emailData.token || undefined;

    let subject: string;
    let react: React.ReactElement;

    switch (emailData.email_action_type) {
      case 'magiclink':
        subject = 'Your GuestHouse sign-in link';
        react = AuthMagicLinkEmail({ signInUrl: actionUrl, token });
        break;
      case 'recovery':
        subject = 'Reset your GuestHouse password';
        react = AuthRecoveryEmail({ resetUrl: actionUrl, token });
        break;
      case 'email_change':
        subject = 'Confirm your new email address';
        react = AuthConfirmSignupEmail({ confirmUrl: actionUrl, token });
        break;
      case 'signup':
      case 'invite':
      case 'email':
      default:
        subject = 'Confirm your email for GuestHouse';
        react = AuthConfirmSignupEmail({ confirmUrl: actionUrl, token });
        break;
    }

    await sendEmail({ to: user.email, subject, react });

    return new NextResponse(null, { status: 200 });
  } catch (err) {
    console.error('[auth-hook] failed to send email:', err);
    return NextResponse.json(
      { error: { http_code: 500, message: 'Failed to send email' } },
      { status: 500 }
    );
  }
}
