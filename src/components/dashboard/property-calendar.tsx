'use client';

import { useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  parseISO,
  isWithinInterval,
  addDays,
} from 'date-fns';
import { cn } from '@/lib/utils';

interface CalendarBooking {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  color: string;
}

interface PropertyCalendarProps {
  month: Date;
  bookings: CalendarBooking[];
}

const COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-teal-100 text-teal-800',
];

export function PropertyCalendar({ month, bookings }: PropertyCalendarProps) {
  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const startPad = startOfMonth(month).getDay();

  return (
    <div>
      <div className="mb-4 grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const dayBookings = bookings.filter((b) => {
            try {
              return isWithinInterval(day, {
                start: parseISO(b.checkIn),
                end: addDays(parseISO(b.checkOut), -1),
              });
            } catch {
              return false;
            }
          });

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'min-h-[72px] rounded-md border p-1 text-xs',
                !isSameMonth(day, month) && 'opacity-40'
              )}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full',
                  isSameDay(day, new Date()) && 'bg-foreground text-background font-medium'
                )}
              >
                {format(day, 'd')}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayBookings.slice(0, 2).map((b) => (
                  <div
                    key={b.id}
                    className={cn('truncate rounded px-1 py-0.5 text-[10px]', b.color)}
                    title={b.guestName}
                  >
                    {b.guestName}
                  </div>
                ))}
                {dayBookings.length > 2 && (
                  <div className="text-[10px] text-muted-foreground">
                    +{dayBookings.length - 2} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {bookings.map((b) => (
          <span
            key={b.id}
            className={cn('rounded-full px-2 py-0.5 text-xs', b.color)}
          >
            {b.guestName}
          </span>
        ))}
      </div>
    </div>
  );
}

export function assignColors(
  bookings: { id: string; guestName: string; checkIn: string; checkOut: string }[]
) {
  const guestColorMap = new Map<string, string>();
  let colorIdx = 0;

  return bookings.map((b) => {
    if (!guestColorMap.has(b.guestName)) {
      guestColorMap.set(b.guestName, COLORS[colorIdx % COLORS.length]);
      colorIdx++;
    }
    return { ...b, color: guestColorMap.get(b.guestName)! };
  });
}
