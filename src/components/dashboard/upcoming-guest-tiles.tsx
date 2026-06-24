import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { BedDouble, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { nightsBetween } from '@/lib/dates';
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

function formatStayDate(date: string): string {
  return format(parseISO(date), 'EEE, MMM d');
}

export function UpcomingGuestTiles({
  guests,
  slug,
}: {
  guests: GuestRosterEntry[];
  slug: string;
}) {
  const upcoming = guests.filter((g) => g.upcomingStay);

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl border bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No upcoming visits on the calendar.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Invite a guest or add a manual visit to get started.
        </p>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {upcoming.map((guest) => {
        const stay = guest.upcomingStay!;
        const onProperty =
          stay.checkIn <= today && stay.checkOut >= today;
        const nights = nightsBetween(stay.checkIn, stay.checkOut);
        const statusLabel = stay.isManual
          ? 'Manual visit'
          : onProperty
            ? 'On property'
            : 'Upcoming';

        return (
          <Link
            key={guest.key}
            href={`/dashboard/${slug}/visits/${stay.visitId}`}
            className="group block"
          >
            <article className="flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-colors hover:border-foreground/20 hover:bg-muted/20">
              <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-2.5">
                <Badge
                  variant={
                    onProperty
                      ? 'default'
                      : stay.isManual
                        ? 'secondary'
                        : 'outline'
                  }
                  className="text-[11px]"
                >
                  {statusLabel}
                </Badge>
                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
              </div>

              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {initials(guest.name)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold tracking-tight group-hover:underline">
                      {guest.name}
                    </p>
                    {guest.email ? (
                      <p className="truncate text-sm text-muted-foreground">
                        {guest.email}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No email on file
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 overflow-hidden rounded-xl border">
                  <div className="grid grid-cols-2 divide-x">
                    <div className="p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Check-in
                      </p>
                      <p className="mt-0.5 text-sm font-medium">
                        {formatStayDate(stay.checkIn)}
                      </p>
                    </div>
                    <div className="p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Checkout
                      </p>
                      <p className="mt-0.5 text-sm font-medium">
                        {formatStayDate(stay.checkOut)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {nights} {nights === 1 ? 'night' : 'nights'}
                    </span>
                    <span className="truncate">
                      {stay.partySize}{' '}
                      {stay.partySize === 1 ? 'guest' : 'guests'}
                    </span>
                  </div>
                </div>

                {stay.roomNames.length > 0 && (
                  <div className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                    <BedDouble className="mt-0.5 h-4 w-4 shrink-0" />
                    <span className="line-clamp-2">
                      {stay.roomNames.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </article>
          </Link>
        );
      })}
    </div>
  );
}
