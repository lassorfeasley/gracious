import { createAdminClient } from '@/lib/supabase/admin';
import type { RoomAvailability } from '@/lib/guest-calendar';

interface VisitGuestRow {
  guest_name: string | null;
  guest_email: string | null;
  guest: { name: string | null; email: string | null } | { name: string | null; email: string | null }[] | null;
}

function resolveGuestName(b: VisitGuestRow): string {
  const user = Array.isArray(b.guest) ? b.guest[0] : b.guest;
  return (
    user?.name ??
    b.guest_name ??
    user?.email?.split('@')[0] ??
    b.guest_email?.split('@')[0] ??
    'Guest'
  );
}

export async function getInvitationRoomAvailability(
  roomIds: string[],
  /** Host views resolve real guest names; guest-facing views stay anonymous. */
  options: { includeGuestNames?: boolean } = {}
): Promise<Record<string, RoomAvailability>> {
  const { includeGuestNames = false } = options;
  const map: Record<string, RoomAvailability> = {};
  for (const id of roomIds) {
    map[id] = { visits: [], blocks: [] };
  }
  if (roomIds.length === 0) return map;

  const admin = createAdminClient();

  const { data: bookingRows } = await admin
    .from('visit_rooms')
    .select(
      `room_id,
      visit:visits(id, status, guest_name, guest_email, guest:users!guest_user_id(name, email), dates:visit_dates(check_in, check_out))`
    )
    .in('room_id', roomIds);

  for (const row of bookingRows ?? []) {
    const visit = Array.isArray(row.visit) ? row.visit[0] : row.visit;
    if (
      !visit ||
      (visit.status !== 'approved' && visit.status !== 'requested')
    ) {
      continue;
    }
    const dates = Array.isArray(visit.dates) ? visit.dates[0] : visit.dates;
    if (!dates?.check_in || !dates?.check_out) continue;
    const entry = map[row.room_id as string];
    if (entry) {
      entry.visits.push({
        id: visit.id,
        guestName: includeGuestNames
          ? resolveGuestName(visit as VisitGuestRow)
          : 'Reserved',
        checkIn: dates.check_in,
        checkOut: dates.check_out,
        pending: visit.status === 'requested',
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
