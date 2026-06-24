import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateRange } from '@/lib/dates';
import { INVITATION_TYPE_LABELS } from '@/lib/invitation-types';
import type { GuestRosterEntry } from '@/lib/guest-roster';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function guestStatus(
  entry: GuestRosterEntry,
  today: string
): {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
} {
  const stay = entry.upcomingVisit;
  if (stay) {
    if (stay.checkIn <= today && stay.checkOut >= today) {
      return { label: 'On property', variant: 'default' };
    }
    return { label: 'Upcoming', variant: 'default' };
  }
  if (entry.invitation?.status === 'pending') {
    return { label: 'Invited', variant: 'secondary' };
  }
  if (entry.invitation?.status === 'accepted') {
    return { label: 'Accepted', variant: 'outline' };
  }
  if (entry.pastVisitsCount > 0) {
    return { label: 'Past guest', variant: 'outline' };
  }
  if (entry.invitation?.status === 'revoked') {
    return { label: 'Revoked', variant: 'destructive' };
  }
  return { label: '—', variant: 'outline' };
}

export function GuestsTable({
  guests,
  slug,
}: {
  guests: GuestRosterEntry[];
  slug: string;
}) {
  const today = new Date().toISOString().split('T')[0];

  if (guests.length === 0) {
    return (
      <div className="rounded-2xl border bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">No guests yet.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite someone or add a manual visit to get started.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y rounded-2xl border bg-card shadow-sm">
      {guests.map((guest) => {
        const status = guestStatus(guest, today);
        const nextLabel = guest.upcomingVisit
          ? formatDateRange(
              guest.upcomingVisit.checkIn,
              guest.upcomingVisit.checkOut
            )
          : guest.invitation
            ? INVITATION_TYPE_LABELS[guest.invitation.type] ??
              guest.invitation.type
            : guest.pastVisitsCount > 0
              ? `${guest.pastVisitsCount} past visit${guest.pastVisitsCount !== 1 ? 's' : ''}`
              : null;

        return (
          <li key={guest.key}>
            <Link
              href={`/dashboard/${slug}/guests/${guest.key}`}
              className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/40 sm:px-6"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                {initials(guest.name)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium group-hover:underline">
                    {guest.name}
                  </p>
                  <Badge variant={status.variant} className="text-[11px]">
                    {status.label}
                  </Badge>
                </div>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {guest.email ?? 'No email on file'}
                  {nextLabel && (
                    <span className="hidden sm:inline">
                      {' '}
                      · {nextLabel}
                    </span>
                  )}
                </p>
                {guest.invitation?.expiresAt && !guest.upcomingVisit && (
                  <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                    Expires {formatDate(guest.invitation.expiresAt)}
                  </p>
                )}
              </div>

              <div className="hidden shrink-0 text-right sm:block">
                {nextLabel && (
                  <p className="text-sm text-muted-foreground">{nextLabel}</p>
                )}
                {guest.invitation?.expiresAt && !guest.upcomingVisit && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Expires {formatDate(guest.invitation.expiresAt)}
                  </p>
                )}
              </div>

              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
