export const CALENDAR_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-green-100 text-green-800',
  'bg-purple-100 text-purple-800',
  'bg-amber-100 text-amber-800',
  'bg-rose-100 text-rose-800',
  'bg-teal-100 text-teal-800',
];

export interface CalendarBookingInput {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
}

export function assignColors<T extends CalendarBookingInput>(
  bookings: T[]
): (T & { color: string })[] {
  const guestColorMap = new Map<string, string>();
  let colorIdx = 0;

  return bookings.map((b) => {
    if (!guestColorMap.has(b.guestName)) {
      guestColorMap.set(
        b.guestName,
        CALENDAR_COLORS[colorIdx % CALENDAR_COLORS.length]
      );
      colorIdx++;
    }
    return { ...b, color: guestColorMap.get(b.guestName)! };
  });
}
