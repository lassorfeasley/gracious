'use client';

import { useMemo, useState } from 'react';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isBefore,
  isSameDay,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarBooking {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  /** Pending approval — shown differently from confirmed stays. */
  pending?: boolean;
}

interface CalendarBlock {
  id: string;
  start_date: string;
  end_date: string;
}

interface DateRange {
  start: string;
  end: string;
}

export interface CalendarSelection {
  checkIn: string | null;
  checkOut: string | null;
}

export type DateField = 'checkIn' | 'checkOut';

interface AvailabilityCalendarProps {
  bookings: CalendarBooking[];
  blocks?: CalendarBlock[];
  monthsToShow?: number;
  /** Enables date-range selection. */
  selectable?: boolean;
  value?: CalendarSelection;
  onChange?: (value: CalendarSelection) => void;
  /** If provided, only days within these ranges can be selected. */
  allowedRanges?: DateRange[];
  /** Which field the next calendar click should fill. */
  activeField?: DateField | null;
  onActiveFieldChange?: (field: DateField | null) => void;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const INNER =
  'flex h-full w-full items-center justify-center rounded-full text-sm transition-colors';

function coversDay(day: Date, start: string, end: string): boolean {
  try {
    return isWithinInterval(day, {
      start: parseISO(start),
      end: addDays(parseISO(end), -1),
    });
  } catch {
    return false;
  }
}

function MonthGrid({
  month,
  bookings,
  blocks,
  selectable,
  value,
  isSelectable,
  onSelect,
}: {
  month: Date;
  bookings: CalendarBooking[];
  blocks: CalendarBlock[];
  selectable: boolean;
  value?: CalendarSelection;
  isSelectable: (dateStr: string) => boolean;
  onSelect: (dateStr: string) => void;
}) {
  const today = startOfDay(new Date());
  const days = useMemo(
    () =>
      eachDayOfInterval({
        start: startOfMonth(month),
        end: endOfMonth(month),
      }),
    [month]
  );
  const startPad = startOfMonth(month).getDay();

  return (
    <div>
      <p className="mb-5 text-center text-base font-semibold">
        {format(month, 'MMMM yyyy')}
      </p>
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="pb-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const booked = bookings.filter((b) =>
            coversDay(day, b.checkIn, b.checkOut)
          );
          const hasPending = booked.some((b) => b.pending);
          const hasConfirmed = booked.some((b) => !b.pending);
          const isBlocked = blocks.some((bl) =>
            coversDay(day, bl.start_date, bl.end_date)
          );
          const isPast = isBefore(day, today);
          const unavailable = booked.length > 0 || isBlocked;
          const isToday = isSameDay(day, today);
          const title =
            booked.length > 0
              ? booked
                  .map((b) =>
                    b.pending ? `${b.guestName} (pending)` : b.guestName
                  )
                  .join(', ')
              : isBlocked
                ? 'Blocked'
                : undefined;

          if (selectable) {
            const dateStr = format(day, 'yyyy-MM-dd');
            const selDay = isSelectable(dateStr);
            const isStart = value?.checkIn === dateStr;
            const isEnd = value?.checkOut === dateStr;
            const endpoint = isStart || isEnd;
            const inRange =
              !!value?.checkIn &&
              !!value?.checkOut &&
              dateStr > value.checkIn &&
              dateStr < value.checkOut;

            return (
              <div
                key={day.toISOString()}
                className="flex aspect-square items-center justify-center p-1.5"
              >
                {selDay ? (
                  <button
                    type="button"
                    onClick={() => onSelect(dateStr)}
                    className={cn(
                      INNER,
                      endpoint && 'bg-foreground font-medium text-background',
                      !endpoint && inRange && 'bg-muted text-foreground',
                      !endpoint &&
                        !inRange &&
                        'text-foreground hover:bg-muted',
                      !endpoint &&
                        isToday &&
                        'ring-1 ring-inset ring-foreground'
                    )}
                  >
                    {format(day, 'd')}
                  </button>
                ) : (
                  <span
                    title={title}
                    className={cn(
                      INNER,
                      unavailable
                        ? 'text-muted-foreground line-through'
                        : 'text-muted-foreground/40'
                    )}
                  >
                    {format(day, 'd')}
                  </span>
                )}
              </div>
            );
          }

          return (
            <div
              key={day.toISOString()}
              className="flex aspect-square items-center justify-center p-1.5"
            >
              <span
                title={title}
                className={cn(
                  INNER,
                  isToday && 'font-semibold ring-1 ring-inset ring-foreground',
                  isPast && !unavailable && 'text-muted-foreground/50',
                  hasPending &&
                    !hasConfirmed &&
                    'bg-amber-100 font-medium text-amber-900 ring-1 ring-inset ring-amber-300',
                  hasConfirmed &&
                    'text-muted-foreground line-through',
                  hasPending &&
                    hasConfirmed &&
                    'bg-amber-50 text-muted-foreground line-through ring-1 ring-inset ring-amber-200',
                  !unavailable && !isPast && 'text-foreground hover:bg-muted'
                )}
              >
                {format(day, 'd')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AvailabilityCalendar({
  bookings,
  blocks = [],
  monthsToShow = 2,
  selectable = false,
  value,
  onChange,
  allowedRanges = [],
  activeField = null,
  onActiveFieldChange,
}: AvailabilityCalendarProps) {
  const [base, setBase] = useState(() => startOfMonth(new Date()));
  const today = startOfDay(new Date());

  const months = Array.from({ length: monthsToShow }, (_, i) =>
    addMonths(base, i)
  );

  function dayUnavailable(day: Date): boolean {
    const booked = bookings.some((b) => coversDay(day, b.checkIn, b.checkOut));
    const blocked = blocks.some((bl) =>
      coversDay(day, bl.start_date, bl.end_date)
    );
    return booked || blocked;
  }

  function isSelectable(dateStr: string): boolean {
    if (!selectable) return false;
    const day = parseISO(dateStr);
    if (isBefore(day, today)) return false;
    if (dayUnavailable(day)) return false;
    if (
      allowedRanges.length > 0 &&
      !allowedRanges.some((r) => dateStr >= r.start && dateStr <= r.end)
    ) {
      return false;
    }
    return true;
  }

  function hasBlockingBetween(start: string, end: string): boolean {
    const interior = eachDayOfInterval({
      start: addDays(parseISO(start), 1),
      end: addDays(parseISO(end), -1),
    });
    return interior.some((d) => !isSelectable(format(d, 'yyyy-MM-dd')));
  }

  function handleSelect(dateStr: string) {
    if (!onChange) return;
    const checkIn = value?.checkIn ?? null;
    const checkOut = value?.checkOut ?? null;

    // Determine which field this click fills: respect an explicit focus,
    // otherwise infer (check-in first, then check-out).
    const field: DateField =
      activeField ?? (!checkIn || (checkIn && checkOut) ? 'checkIn' : 'checkOut');

    if (field === 'checkOut') {
      // A valid checkout must be after check-in with nothing blocking between.
      if (checkIn && dateStr > checkIn && !hasBlockingBetween(checkIn, dateStr)) {
        onChange({ checkIn, checkOut: dateStr });
        onActiveFieldChange?.(null);
        return;
      }
      // Otherwise treat the click as a new check-in.
      onChange({ checkIn: dateStr, checkOut: null });
      onActiveFieldChange?.('checkOut');
      return;
    }

    // field === 'checkIn' — keep an existing checkout only if still valid.
    if (checkOut && dateStr < checkOut && !hasBlockingBetween(dateStr, checkOut)) {
      onChange({ checkIn: dateStr, checkOut });
      onActiveFieldChange?.(null);
      return;
    }
    onChange({ checkIn: dateStr, checkOut: null });
    onActiveFieldChange?.('checkOut');
  }

  return (
    <div>
      <div className="relative">
        <button
          type="button"
          onClick={() => setBase((m) => addMonths(m, -1))}
          aria-label="Previous month"
          className="absolute left-0 top-0 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => setBase((m) => addMonths(m, 1))}
          aria-label="Next month"
          className="absolute right-0 top-0 flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <div
          className={cn(
            'grid gap-y-10',
            monthsToShow > 1 ? 'gap-x-16 px-10 sm:grid-cols-2' : 'px-2'
          )}
        >
          {months.map((m) => (
            <MonthGrid
              key={m.toISOString()}
              month={m}
              bookings={bookings}
              blocks={blocks}
              selectable={selectable}
              value={value}
              isSelectable={isSelectable}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
      {!selectable && (bookings.length > 0 || blocks.length > 0) && (
        <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
          {bookings.some((b) => !b.pending) && (
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px] text-muted-foreground line-through ring-1 ring-inset ring-border">
                1
              </span>
              Confirmed stay
            </span>
          )}
          {bookings.some((b) => b.pending) && (
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-medium text-amber-900 ring-1 ring-inset ring-amber-300">
                1
              </span>
              Pending request
            </span>
          )}
          {blocks.length > 0 && <span>Crossed-out dates may also be blocked</span>}
          <span className="w-full sm:w-auto">
            Hover a date to see who&apos;s staying.
          </span>
        </div>
      )}
    </div>
  );
}
