import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import ResetPasswordForm from './reset-password-form';

export const metadata: Metadata = { title: 'Set a new password · Gracious' };

/**
 * Reached from the recovery email link after /auth/confirm verifies the
 * token and establishes a session. Without a session the link was stale,
 * so send the visitor back to request a fresh one.
 */
export default async function ResetPasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/forgot-password?error=expired');
  return <ResetPasswordForm />;
}
