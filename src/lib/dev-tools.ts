import type { GuestPreviewAs, GuestPreviewBookingStatus } from '@/lib/guest-preview';
import { guestPreviewQuery } from '@/lib/guest-preview';

export type AppView = 'guest' | 'host' | 'admin';

export function isDevToolsEnabled(): boolean {
  return process.env.NODE_ENV !== 'production';
}

/** In development, any signed-in user can open /admin to preview the UI. */
export function isDevAdminPreviewEnabled(): boolean {
  return isDevToolsEnabled();
}

export function detectAppView(pathname: string): AppView | null {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/dashboard')) return 'host';
  if (pathname.startsWith('/invite') || pathname === '/my-trips') return 'guest';
  return null;
}

export function extractInviteToken(pathname: string): string | null {
  const match = pathname.match(/^\/invite\/([^/]+)/);
  return match?.[1] ?? null;
}

export function extractPropertySlug(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  return match?.[1] ?? null;
}

export function buildGuestDevPath(
  token: string,
  as: GuestPreviewAs = 'booking',
  status?: GuestPreviewBookingStatus
): string {
  return `/invite/${token}?${guestPreviewQuery(as, status)}`;
}

export function buildHostDevPath(slug?: string | null): string {
  return slug ? `/dashboard/${slug}/overview` : '/dashboard';
}

export const ADMIN_DEV_PATH = '/admin';
