type BookingCalendarRow = {
  id: string;
  status: string;
  guest_name: string | null;
  guest_email: string | null;
  guest: { name: string | null; email: string } | { name: string | null; email: string }[] | null;
  dates:
    | { check_in: string; check_out: string }
    | { check_in: string; check_out: string }[]
    | null;
};

export function mapPropertyVisitsToCalendar(
  visits: BookingCalendarRow[],
  options?: { includeRequested?: boolean }
) {
  const includeRequested = options?.includeRequested ?? false;

  return visits
    .filter((b) => {
      if (b.status === 'approved') return true;
      if (includeRequested && b.status === 'requested') return true;
      return false;
    })
    .map((b) => {
      const dates = Array.isArray(b.dates) ? b.dates[0] : b.dates;
      const guest = (Array.isArray(b.guest) ? b.guest[0] : b.guest) as
        | { name: string | null; email: string }
        | null;
      const guestName =
        guest?.name ??
        guest?.email?.split('@')[0] ??
        b.guest_name ??
        b.guest_email?.split('@')[0] ??
        'Guest';
      return {
        id: b.id,
        guestName,
        checkIn: dates?.check_in ?? '',
        checkOut: dates?.check_out ?? '',
        pending: b.status === 'requested',
      };
    })
    .filter((b) => b.checkIn && b.checkOut);
}
