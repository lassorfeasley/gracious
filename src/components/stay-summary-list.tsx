import { parseISO, differenceInCalendarDays } from 'date-fns';
import { formatDateRange } from '@/lib/dates';

/**
 * Shared stay summary (dates · nights, rooms, guests) used by both the guest
 * manage-stay card and the host manage-booking sidebar.
 */
export function StaySummaryList({
  checkIn,
  checkOut,
  roomNames,
  partySize,
}: {
  checkIn: string;
  checkOut: string;
  roomNames: string[];
  partySize: number;
}) {
  const nights = differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));

  return (
    <dl className="space-y-3 text-sm">
      <div>
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Dates
        </dt>
        <dd className="mt-0.5 font-medium">
          {formatDateRange(checkIn, checkOut)}
          <span className="ml-1 font-normal text-muted-foreground">
            · {nights} {nights === 1 ? 'night' : 'nights'}
          </span>
        </dd>
      </div>
      {roomNames.length > 0 && (
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Rooms
          </dt>
          <dd className="mt-0.5">{roomNames.join(', ')}</dd>
        </div>
      )}
      <div>
        <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Guests
        </dt>
        <dd className="mt-0.5">
          {partySize} {partySize === 1 ? 'guest' : 'guests'}
        </dd>
      </div>
    </dl>
  );
}
