import { datesOverlap } from '@/lib/dates';

export interface CalendarBooking {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  /** Pending approval — shown differently from confirmed stays. */
  pending?: boolean;
}

export interface CalendarBlock {
  id: string;
  start_date: string;
  end_date: string;
}

export interface RoomAvailability {
  bookings: CalendarBooking[];
  blocks: CalendarBlock[];
}

/** True if the stay range overlaps any booking or block in the combined lists. */
export function rangeConflictsWithAvailability(
  checkIn: string | null,
  checkOut: string | null,
  bookings: CalendarBooking[],
  blocks: CalendarBlock[]
): boolean {
  if (!checkIn || !checkOut) return false;

  for (const b of bookings) {
    if (datesOverlap(checkIn, checkOut, b.checkIn, b.checkOut)) {
      return true;
    }
  }
  for (const bl of blocks) {
    if (datesOverlap(checkIn, checkOut, bl.start_date, bl.end_date)) {
      return true;
    }
  }
  return false;
}
