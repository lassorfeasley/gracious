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
}

interface CalendarBlock {
  id: string;
  start_date: string;
  end_date: string;
}

interface AvailabilityCalendarProps {
  bookings: CalendarBooking[];
  blocks?: CalendarBlock[];
  monthsToShow?: number;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

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
}: {
  month: Date;
  bookings: CalendarBooking[];
  blocks: CalendarBlock[];
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
          const isBlocked = blocks.some((bl) =>
            coversDay(day, bl.start_date, bl.end_date)
          );
          const isPast = isBefore(day, today);
          const unavailable = booked.length > 0 || isBlocked;
          const isToday = isSameDay(day, today);
          const title =
            booked.length > 0
              ? booked.map((b) => b.guestName).join(', ')
              : isBlocked
                ? 'Blocked'
                : undefined;

          return (
            <div key={day.toISOString()} className="flex aspect-square items-center justify-center p-1.5">
              <span
                title={title}
                className={cn(
                  'flex h-full w-full items-center justify-center rounded-full text-sm',
                  isToday && 'font-semibold ring-1 ring-inset ring-foreground',
                  isPast && !unavailable && 'text-muted-foreground/50',
                  unavailable && 'text-muted-foreground line-through',
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
}: AvailabilityCalendarProps) {
  const [base, setBase] = useState(() => startOfMonth(new Date()));

  const months = Array.from({ length: monthsToShow }, (_, i) =>
    addMonths(base, i)
  );

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
            'grid gap-x-16 gap-y-10 px-10',
            monthsToShow > 1 && 'sm:grid-cols-2'
          )}
        >
          {months.map((m) => (
            <MonthGrid
              key={m.toISOString()}
              month={m}
              bookings={bookings}
              blocks={blocks}
            />
          ))}
        </div>
      </div>
      {(bookings.length > 0 || blocks.length > 0) && (
        <p className="mt-6 text-xs text-muted-foreground">
          Crossed-out dates are already booked or blocked. Hover a date to see who&apos;s
          staying.
        </p>
      )}
    </div>
  );
}
