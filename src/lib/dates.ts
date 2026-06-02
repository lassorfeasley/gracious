import {
  format,
  parseISO,
  isWithinInterval,
  areIntervalsOverlapping,
  addDays,
  differenceInDays,
  startOfDay,
  isBefore,
  isAfter,
} from 'date-fns';

export function formatDate(date: string | Date, fmt = 'MMM d, yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatDateRange(checkIn: string, checkOut: string) {
  return `${formatDate(checkIn)} – ${formatDate(checkOut)}`;
}

export function nightsBetween(checkIn: string, checkOut: string) {
  return differenceInDays(parseISO(checkOut), parseISO(checkIn));
}

export function datesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string
): boolean {
  return areIntervalsOverlapping(
    { start: parseISO(aStart), end: addDays(parseISO(aEnd), -1) },
    { start: parseISO(bStart), end: addDays(parseISO(bEnd), -1) },
    { inclusive: true }
  );
}

export function isDateInRange(
  date: string,
  start: string,
  end: string
): boolean {
  const d = parseISO(date);
  return isWithinInterval(d, {
    start: parseISO(start),
    end: addDays(parseISO(end), -1),
  });
}

export function isRangeWithinWindows(
  checkIn: string,
  checkOut: string,
  windows: { start_date: string; end_date: string }[]
): boolean {
  if (windows.length === 0) return true;
  return windows.some(
    (w) =>
      !isBefore(parseISO(checkIn), parseISO(w.start_date)) &&
      !isAfter(parseISO(checkOut), parseISO(w.end_date))
  );
}

export function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

export function todayISO(): string {
  return toISODate(startOfDay(new Date()));
}
