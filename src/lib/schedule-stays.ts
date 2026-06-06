import type { GuestRosterEntry } from '@/lib/guest-roster';
import type { ScheduleStay } from '@/components/dashboard/guests-schedule-view';

export function buildScheduleStays(roster: GuestRosterEntry[]): ScheduleStay[] {
  const seen = new Set<string>();

  return roster.flatMap((guest) =>
    guest.stays
      .filter(
        (s) => s.status === 'approved' || s.status === 'requested'
      )
      .filter((s) => {
        if (seen.has(s.bookingId)) return false;
        seen.add(s.bookingId);
        return true;
      })
      .map((s) => ({
        bookingId: s.bookingId,
        guestKey: guest.key,
        guestName: guest.name,
        checkIn: s.checkIn,
        checkOut: s.checkOut,
        status: s.status,
        partySize: s.partySize,
        roomNames: s.roomNames,
        isManual: s.isManual,
      }))
  );
}
