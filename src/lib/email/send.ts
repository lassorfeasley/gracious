import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import { render } from '@react-email/components';
import { appUrl } from '@/lib/env';

let resend: Resend | null = null;

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resend) resend = new Resend(key);
  return resend;
}

/** The configured sender for every outgoing email. */
export const fromAddress = () =>
  process.env.RESEND_FROM ?? 'Gracious <onboarding@resend.dev>';

export async function sendEmail({
  to,
  subject,
  react,
  attachments,
  headers,
  replyTo,
}: {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  attachments?: { filename: string; content: Buffer | string }[];
  headers?: Record<string, string>;
  /** Where replies should go when it differs from the sender. */
  replyTo?: string;
}) {
  const client = getResend();
  const html = await render(react);

  if (!client) {
    console.log('[email:dev]', { to, subject, replyTo, headers, html: html.slice(0, 200) });
    return { id: 'dev' };
  }

  const { data, error } = await client.emails.send({
    from: fromAddress(),
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    attachments,
    headers,
    replyTo,
  });

  if (error) throw new Error(error.message);
  return data;
}

export async function logNotification({
  userId,
  bookingId,
  invitationId,
  type,
}: {
  userId?: string;
  bookingId?: string;
  invitationId?: string;
  type: string;
}) {
  const admin = createAdminClient();
  await admin.from('notifications_log').insert({
    user_id: userId ?? null,
    booking_id: bookingId ?? null,
    invitation_id: invitationId ?? null,
    type,
  });
}

export async function wasNotificationSent(
  bookingId: string,
  type: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('notifications_log')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('type', type)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export { appUrl };
