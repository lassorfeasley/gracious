'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  type GuestPreviewAs,
  type GuestPreviewBookingStatus,
  isGuestPreviewEnabled,
  parseGuestPreviewAs,
  parseGuestPreviewBookingStatus,
} from '@/lib/guest-preview';
import {
  type AppView,
  ADMIN_DEV_PATH,
  LANDING_DEV_PATH,
  buildGuestDevPath,
  buildHostDevPath,
  detectAppView,
  extractInviteToken,
  extractPropertySlug,
  isDevToolsEnabled,
} from '@/lib/dev-tools';
import {
  getStoredInviteToken,
  getStoredPropertySlug,
  setStoredInviteToken,
  setStoredPropertySlug,
} from '@/lib/dev-context-storage';

const APP_VIEWS: { id: AppView; label: string }[] = [
  { id: 'landing', label: 'Landing' },
  { id: 'guest', label: 'Guest' },
  { id: 'host', label: 'Host' },
  { id: 'admin', label: 'Admin' },
];

const GUEST_STATES: { id: GuestPreviewAs; label: string }[] = [
  { id: 'signed-out', label: 'Before sign-in' },
  { id: 'booking', label: 'Booking' },
  { id: 'booked', label: 'Manage stay' },
];

const BOOKING_STATUSES: { id: GuestPreviewBookingStatus; label: string }[] = [
  { id: 'requested', label: 'Requested' },
  { id: 'approved', label: 'Approved' },
];

function SegmentTabs<T extends string>({
  items,
  value,
  getHref,
  ariaLabel,
  activeClassName,
}: {
  items: { id: T; label: string }[];
  value: T;
  getHref: (id: T) => string;
  ariaLabel: string;
  activeClassName?: string;
}) {
  return (
    <div
      className="inline-flex rounded-lg bg-black/20 p-0.5"
      role="tablist"
      aria-label={ariaLabel}
    >
      {items.map(({ id, label }) => (
        <Link
          key={id}
          href={getHref(id)}
          role="tab"
          aria-selected={value === id}
          className={cn(
            'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
            value === id
              ? (activeClassName ?? 'bg-white text-zinc-900 shadow-sm')
              : 'text-white/80 hover:text-white'
          )}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}

export function DevToolbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentView = detectAppView(pathname);
  const guestPreview = isGuestPreviewEnabled(searchParams.get('preview') ?? undefined);
  const guestAs = parseGuestPreviewAs(searchParams.get('as') ?? undefined);
  const guestStatus = parseGuestPreviewBookingStatus(
    searchParams.get('status') ?? undefined
  );
  const showGuestSubControls =
    currentView === 'guest' && pathname.startsWith('/invite/') && guestPreview;

  const inviteToken =
    extractInviteToken(pathname) ?? getStoredInviteToken();
  const propertySlug = getStoredPropertySlug();

  const viewHrefs = useMemo(
    () => ({
      landing: LANDING_DEV_PATH,
      guest: inviteToken
        ? buildGuestDevPath(inviteToken, guestAs, guestStatus)
        : '/my-trips',
      host: buildHostDevPath(propertySlug),
      admin: ADMIN_DEV_PATH,
    }),
    [inviteToken, guestAs, guestStatus, propertySlug]
  );

  useEffect(() => {
    const token = extractInviteToken(pathname);
    if (token) setStoredInviteToken(token);
    const slug = extractPropertySlug(pathname);
    if (slug) setStoredPropertySlug(slug);
  }, [pathname]);

  if (!isDevToolsEnabled()) return null;

  return (
    <div className="sticky top-0 z-[100] border-b border-zinc-700 bg-zinc-900 text-zinc-100">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            Dev view switcher
            <span className="ml-2 normal-case text-zinc-500">
              (admin preview — sign in required)
            </span>
          </p>
          <SegmentTabs
            items={APP_VIEWS}
            value={currentView ?? 'guest'}
            getHref={(id) => viewHrefs[id]}
            ariaLabel="Application view"
          />
        </div>

        {showGuestSubControls && (
          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-700/80 pt-2">
            <span className="text-xs text-zinc-400">Guest UI:</span>
            <SegmentTabs
              items={GUEST_STATES}
              value={guestAs}
              getHref={(as) =>
                inviteToken
                  ? buildGuestDevPath(inviteToken, as, guestStatus)
                  : '/my-trips'
              }
              ariaLabel="Guest preview state"
              activeClassName="bg-amber-400 text-amber-950 shadow-sm"
            />
            {guestAs === 'booked' && (
              <SegmentTabs
                items={BOOKING_STATUSES}
                value={guestStatus}
                getHref={(status) =>
                  inviteToken
                    ? buildGuestDevPath(inviteToken, 'booked', status)
                    : '/my-trips'
                }
                ariaLabel="Booking status preview"
                activeClassName="bg-amber-300 text-amber-950 shadow-sm"
              />
            )}
            <span className="ml-auto text-xs text-zinc-500">
              Guest preview — no submissions
            </span>
          </div>
        )}

        {currentView === 'guest' &&
          pathname.startsWith('/invite/') &&
          !guestPreview && (
            <p className="border-t border-zinc-700/80 pt-2 text-xs text-zinc-400">
              Open guest preview:{' '}
              <Link
                href={
                  inviteToken
                    ? buildGuestDevPath(inviteToken, 'booking')
                    : '/my-trips'
                }
                className="font-medium text-amber-400 underline underline-offset-2"
              >
                enable preview mode
              </Link>
            </p>
          )}
      </div>
    </div>
  );
}
