import Link from 'next/link';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { PersonAvatar } from '@/components/ui/person-avatar';
import { formatDateRange } from '@/lib/dates';
import { cn } from '@/lib/utils';
import type { PortfolioArrival } from '@/lib/portfolio';

/**
 * "Arrives in 3 days" reads far faster than a dot on a month grid, so the
 * schedule section leads with the next few guests as human cards and lets the
 * calendar be the drill-down.
 */
function arrivalLabel(arrival: PortfolioArrival): {
  text: string;
  soon: boolean;
} {
  const today = new Date();
  const daysUntil = differenceInCalendarDays(parseISO(arrival.checkIn), today);
  const daysUntilOut = differenceInCalendarDays(
    parseISO(arrival.checkOut),
    today
  );

  if (daysUntil <= 0 && daysUntilOut >= 0) return { text: 'Here now', soon: true };
  if (daysUntil === 0) return { text: 'Arrives today', soon: true };
  if (daysUntil === 1) return { text: 'Arrives tomorrow', soon: true };
  if (daysUntil <= 13) return { text: `In ${daysUntil} days`, soon: false };
  return {
    text: format(parseISO(arrival.checkIn), 'MMM d'),
    soon: false,
  };
}

export function NextUpStrip({
  arrivals,
  showHouse,
}: {
  arrivals: PortfolioArrival[];
  /** Show which home each guest is visiting (multi-home hosts). */
  showHouse: boolean;
}) {
  if (arrivals.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {arrivals.map((arrival) => {
        const label = arrivalLabel(arrival);
        return (
          <Link
            key={arrival.id}
            href={`/dashboard/${arrival.slug}/visits/${arrival.id}`}
            className="group flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
          >
            <PersonAvatar name={arrival.guestName} seed={arrival.id} size="md" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-semibold">{arrival.guestName}</p>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium',
                    label.soon
                      ? 'bg-brass/15 text-brass'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {label.text}
                </span>
              </div>
              <p className="mt-0.5 truncate text-sm text-muted-foreground">
                {formatDateRange(arrival.checkIn, arrival.checkOut)}
                {showHouse && ` · ${arrival.houseName}`}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
