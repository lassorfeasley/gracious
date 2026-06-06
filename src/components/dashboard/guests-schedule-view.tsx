'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  parseISO,
  startOfDay,
  startOfMonth,
} from 'date-fns';
import { ChevronLeft, ChevronRight, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatDateRange, nightsBetween } from '@/lib/dates';
import { cn } from '@/lib/utils';

export interface ScheduleStay {
  bookingId: string;
  guestKey: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  status: string;
  partySize: number;
  roomNames: string[];
  isManual: boolean;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function stayTouchesDay(dateStr: string, checkIn: string, checkOut: string) {
  return (
    (dateStr >= checkIn && dateStr < checkOut) || dateStr === checkOut
  );
}

function staysOnDay(stays: ScheduleStay[], dateStr: string) {
  return stays.filter((s) => stayTouchesDay(dateStr, s.checkIn, s.checkOut));
}

function dayLabel(dateStr: string, stay: ScheduleStay) {
  if (dateStr === stay.checkIn && dateStr === stay.checkOut) return 'Day stay';
  if (dateStr === stay.checkIn) return 'Arriving';
  if (dateStr === stay.checkOut) return 'Departing';
  return 'On property';
}

function buildTimelineDays(stays: ScheduleStay[]): string[] {
  const daySet = new Set<string>();
  for (const stay of stays) {
    let day = parseISO(stay.checkIn);
    const end = parseISO(stay.checkOut);
    while (day <= end) {
      daySet.add(format(day, 'yyyy-MM-dd'));
      day = addDays(day, 1);
    }
  }
  return Array.from(daySet).sort();
}

function AgendaMonthGrid({
  month,
  stays,
  selectedDate,
  onSelectDate,
}: {
  month: Date;
  stays: ScheduleStay[];
  selectedDate: string;
  onSelectDate: (dateStr: string) => void;
}) {
  const today = startOfDay(new Date());
  const days = eachDayOfInterval({
    start: startOfMonth(month),
    end: endOfMonth(month),
  });
  const startPad = startOfMonth(month).getDay();

  return (
    <div>
      <p className="mb-4 text-center text-sm font-semibold">
        {format(month, 'MMMM yyyy')}
      </p>
      <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="pb-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="aspect-square" />
        ))}
        {days.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const count = staysOnDay(stays, dateStr).length;
          const isSelected = selectedDate === dateStr;
          const isToday = isSameDay(day, today);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                'flex aspect-square flex-col items-center justify-center rounded-md text-sm transition-colors',
                isSelected
                  ? 'bg-foreground font-medium text-background'
                  : count > 0
                    ? 'bg-muted/70 font-medium hover:bg-muted'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground',
                isToday && !isSelected && 'ring-1 ring-inset ring-foreground/40'
              )}
            >
              <span>{format(day, 'd')}</span>
              {count > 0 && (
                <span
                  className={cn(
                    'mt-0.5 text-[10px] leading-none',
                    isSelected ? 'text-background/80' : 'text-muted-foreground'
                  )}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GuestsScheduleView({
  slug,
  stays,
}: {
  slug: string;
  stays: ScheduleStay[];
}) {
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const [selectedDate, setSelectedDate] = useState(today);
  const [base, setBase] = useState(() => startOfMonth(parseISO(today)));
  const timelineRef = useRef<HTMLDivElement>(null);

  const timelineDays = useMemo(() => buildTimelineDays(stays), [stays]);
  const months = useMemo(
    () => [base, addMonths(base, 1)],
    [base]
  );

  const scrollToDay = useCallback(
    (dateStr: string) => {
      const container = timelineRef.current;
      if (!container || timelineDays.length === 0) return;

      let target = dateStr;
      if (!timelineDays.includes(dateStr)) {
        const next = timelineDays.find((d) => d >= dateStr);
        const prev = [...timelineDays].reverse().find((d) => d <= dateStr);
        target = next ?? prev ?? timelineDays[0];
      }

      const el = container.querySelector(`[data-day="${target}"]`);
      if (el instanceof HTMLElement) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [timelineDays]
  );

  const handleSelectDate = useCallback((dateStr: string) => {
    setSelectedDate(dateStr);
  }, []);

  useEffect(() => {
    if (timelineDays.length === 0) return;
    const id = requestAnimationFrame(() => scrollToDay(selectedDate));
    return () => cancelAnimationFrame(id);
  }, [selectedDate, scrollToDay, timelineDays.length]);

  if (stays.length === 0) {
    return (
      <div className="rounded-2xl border bg-muted/20 px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          No stays on the calendar yet.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a manual stay or invite a guest to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border bg-card shadow-sm lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(280px,380px)]">
      <div className="border-b p-5 lg:border-b-0 lg:border-r">
        <div className="relative">
          <button
            type="button"
            onClick={() => setBase((m) => addMonths(m, -1))}
            aria-label="Previous month"
            className="absolute left-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setBase((m) => addMonths(m, 1))}
            aria-label="Next month"
            className="absolute right-0 top-0 z-10 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <div className="grid gap-x-6 gap-y-6 px-10 sm:grid-cols-2">
            {months.map((month) => (
              <AgendaMonthGrid
                key={month.toISOString()}
                month={month}
                stays={stays}
                selectedDate={selectedDate}
                onSelectDate={handleSelectDate}
              />
            ))}
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Select a day to jump to it in the timeline.
        </p>
      </div>

      <div className="flex min-h-[320px] flex-col lg:max-h-[520px]">
        <div className="shrink-0 border-b px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Timeline
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            All stays · {timelineDays.length}{' '}
            {timelineDays.length === 1 ? 'day' : 'days'}
          </p>
        </div>

        <div
          ref={timelineRef}
          className="flex-1 overflow-y-auto px-5 py-4"
        >
          <div className="relative space-y-6 border-l border-border pl-4">
            {timelineDays.map((dateStr) => {
              const dayStays = staysOnDay(stays, dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === today;

              return (
                <section
                  key={dateStr}
                  data-day={dateStr}
                  className="relative scroll-mt-4"
                >
                  <div
                    className={cn(
                      'absolute -left-[calc(1rem+5px)] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background',
                      isSelected
                        ? 'bg-foreground'
                        : isToday
                          ? 'bg-foreground/50'
                          : 'bg-muted-foreground/40'
                    )}
                  />
                  <div
                    className={cn(
                      'mb-3 -ml-4 rounded-md py-1 pl-4',
                      isSelected && 'bg-muted/60'
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm font-semibold',
                        isToday && 'text-foreground'
                      )}
                    >
                      {formatDate(dateStr, 'EEE, MMM d, yyyy')}
                      {isToday && (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          Today
                        </span>
                      )}
                    </p>
                  </div>

                  <ul className="space-y-2">
                    {dayStays.map((stay) => {
                      const nights = nightsBetween(stay.checkIn, stay.checkOut);
                      const touchLabel = dayLabel(dateStr, stay);

                      return (
                        <li key={`${dateStr}-${stay.bookingId}`}>
                          <Link
                            href={`/dashboard/${slug}/bookings/${stay.bookingId}`}
                            className="group block rounded-lg border p-3 transition-colors hover:border-foreground/20 hover:bg-muted/30"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-sm font-medium group-hover:underline">
                                {stay.guestName}
                              </p>
                              <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </div>
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              <Badge
                                variant={
                                  stay.status === 'requested'
                                    ? 'secondary'
                                    : 'outline'
                                }
                                className="text-[10px]"
                              >
                                {touchLabel}
                              </Badge>
                              {stay.status === 'requested' && (
                                <Badge variant="outline" className="text-[10px]">
                                  Pending
                                </Badge>
                              )}
                              {stay.isManual && (
                                <Badge variant="secondary" className="text-[10px]">
                                  Manual
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              {formatDateRange(stay.checkIn, stay.checkOut)} ·{' '}
                              {nights} {nights === 1 ? 'night' : 'nights'}
                              {stay.roomNames.length > 0 &&
                                ` · ${stay.roomNames.join(', ')}`}
                            </p>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
