import type { User } from '@/types/database';

/** Comma-separated emails in SITE_ADMIN_EMAILS can access /admin before the
 * is_admin flag is set in the DB (bootstrap access). */
export function getSiteAdminEmails(): string[] {
  return (process.env.SITE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSiteAdminEmail(email: string): boolean {
  return getSiteAdminEmails().includes(email.toLowerCase());
}

export function isSiteAdmin(user: Pick<User, 'is_admin' | 'email'>): boolean {
  return user.is_admin || isSiteAdminEmail(user.email);
}
