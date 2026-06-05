import type { User, UserRole } from '@/types/database';

/** Comma-separated emails in SITE_ADMIN_EMAILS can access /admin before role is set in DB. */
export function getSiteAdminEmails(): string[] {
  return (process.env.SITE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isSiteAdminEmail(email: string): boolean {
  return getSiteAdminEmails().includes(email.toLowerCase());
}

export function isSiteAdmin(user: Pick<User, 'role' | 'email'>): boolean {
  return user.role === 'admin' || isSiteAdminEmail(user.email);
}

export const ASSIGNABLE_ROLES: UserRole[] = ['guest', 'owner', 'admin'];
