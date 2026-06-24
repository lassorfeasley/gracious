import { datesOverlap } from '@/lib/dates';

export interface CalendarVisit {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  /** Pending approval — shown differently from confirmed visits. */
  pending?: boolean;
}

export interface CalendarBlock {
  id: string;
  start_date: string;
  end_date: string;
}

export interface RoomAvailability {
  visits: CalendarVisit[];
  blocks: CalendarBlock[];
}

/** True if the visit range overlaps any visit or block in the combined lists. */
export function rangeConflictsWithAvailability(
  checkIn: string | null,
  checkOut: string | null,
  visits: CalendarVisit[],
  blocks: CalendarBlock[]
): boolean {
  if (!checkIn || !checkOut) return false;

  for (const b of visits) {
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
