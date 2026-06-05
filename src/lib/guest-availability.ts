import { createAdminClient } from '@/lib/supabase/admin';
import type { RoomAvailability } from '@/lib/guest-calendar';

export async function getInvitationRoomAvailability(
  roomIds: string[]
): Promise<Record<string, RoomAvailability>> {
  const map: Record<string, RoomAvailability> = {};
  for (const id of roomIds) {
    map[id] = { bookings: [], blocks: [] };
  }
  if (roomIds.length === 0) return map;

  const admin = createAdminClient();

  const { data: bookingRows } = await admin
    .from('booking_rooms')
    .select(
      `room_id,
      booking:bookings(id, status, dates:booking_dates(check_in, check_out))`
    )
    .in('room_id', roomIds);

  for (const row of bookingRows ?? []) {
    const booking = Array.isArray(row.booking) ? row.booking[0] : row.booking;
    if (
      !booking ||
      (booking.status !== 'approved' && booking.status !== 'requested')
    ) {
      continue;
    }
    const dates = Array.isArray(booking.dates) ? booking.dates[0] : booking.dates;
    if (!dates?.check_in || !dates?.check_out) continue;
    const entry = map[row.room_id as string];
    if (entry) {
      entry.bookings.push({
        id: booking.id,
        guestName: 'Booked',
        checkIn: dates.check_in,
        checkOut: dates.check_out,
      });
    }
  }

  const { data: blockRows } = await admin
    .from('room_availability')
    .select('*')
    .in('room_id', roomIds)
    .eq('is_blocked', true);

  for (const block of blockRows ?? []) {
    const entry = map[block.room_id];
    if (entry) {
      entry.blocks.push({
        id: block.id,
        start_date: block.start_date,
        end_date: block.end_date,
      });
    }
  }

  return map;
}
