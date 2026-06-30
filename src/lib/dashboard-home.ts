import { createAdminClient } from '@/lib/supabase/admin';
import type { InvitationType, Property } from '@/types/database';

/**
 * Cross-house "needs you" queue for the dashboard home base. These are the two
 * things that move a guest toward a confirmed visit, regardless of which home
 * they're for:
 *   - `requestedVisits`  — a guest asked to come; the host must approve/decline.
 *   - `pendingInvitations` — the host invited someone who hasn't replied yet.
 *
 * Reads go through the admin client (like `getPortfolioData`): the caller has
 * already proven ownership via `getOwnerProperties`, and RLS would otherwise
 * hide the guest's user row from the host on invite-flow visits.
 */

export interface ActionQueueVisit {
  id: string;
  propertySlug: string;
  propertyName: string;
  guestName: string;
  email: string | null;
  avatarUrl: string | null;
  relationship: string | null;
  rooms: string[];
  partySize: number;
  checkIn: string;
  checkOut: string;
}

export interface ActionQueueInvite {
  id: string;
  propertySlug: string;
  propertyName: string;
  token: string;
  guestName: string;
  email: string | null;
  rooms: string[];
  /** Combined capacity of the invited rooms (sum of max occupancy). */
  maxGuests: number;
  inviteType: InvitationType;
  /** When the invitation was created/sent. */
  sentAt: string;
  /** When the invitation lapses, if it has an expiry. */
  expiresAt: string | null;
  checkIn: string | null;
  checkOut: string | null;
}

type RoomShape = { name: string | null; max_occupancy?: number | null };
type RoomJoin = { room: RoomShape | RoomShape[] | null }[] | null | undefined;

function roomNames(rows: RoomJoin): string[] {
  if (!rows) return [];
  const names: string[] = [];
  for (const row of rows) {
    const room = Array.isArray(row.room) ? row.room[0] : row.room;
    if (room?.name) names.push(room.name);
  }
  return names;
}

function roomCapacity(rows: RoomJoin): number {
  if (!rows) return 0;
  let total = 0;
  for (const row of rows) {
    const room = Array.isArray(row.room) ? row.room[0] : row.room;
    if (room?.max_occupancy) total += room.max_occupancy;
  }
  return total;
}

export interface HostActionQueue {
  requestedVisits: ActionQueueVisit[];
  pendingInvitations: ActionQueueInvite[];
}

export async function getHostActionQueue(
  properties: Property[]
): Promise<HostActionQueue> {
  if (properties.length === 0) {
    return { requestedVisits: [], pendingInvitations: [] };
  }

  const admin = createAdminClient();
  const propertyIds = properties.map((p) => p.id);
  const byId = new Map(properties.map((p) => [p.id, p]));

  const [{ data: visitRows }, { data: inviteRows }] = await Promise.all([
    admin
      .from('visits')
      .select(
        `id, property_id, guest_name, guest_email, relationship, party_size, guest:users!guest_user_id(name, email, avatar_url), invitation:invitations(guest_name, guest_first_name, guest_last_name, guest_email), dates:visit_dates(check_in, check_out), visit_rooms(room:rooms(name))`
      )
      .in('property_id', propertyIds)
      .eq('status', 'requested'),
    admin
      .from('invitations')
      .select(
        `id, property_id, token, type, guest_email, guest_first_name, guest_last_name, guest_name, created_at, expires_at, invitation_windows(start_date, end_date), invitation_rooms(room:rooms(name, max_occupancy))`
      )
      .in('property_id', propertyIds)
      .eq('status', 'pending')
      .order('created_at', { ascending: false }),
  ]);

  const requestedVisits: ActionQueueVisit[] = [];
  for (const row of visitRows ?? []) {
    const property = byId.get(row.property_id as string);
    if (!property) continue;

    const dates = Array.isArray(row.dates) ? row.dates[0] : row.dates;
    const guest = (Array.isArray(row.guest) ? row.guest[0] : row.guest) as
      | { name: string | null; email: string; avatar_url: string | null }
      | null;
    const inv = (Array.isArray(row.invitation)
      ? row.invitation[0]
      : row.invitation) as
      | {
          guest_name: string | null;
          guest_first_name: string | null;
          guest_last_name: string | null;
          guest_email: string | null;
        }
      | null;
    const invName =
      inv?.guest_name ||
      [inv?.guest_first_name, inv?.guest_last_name].filter(Boolean).join(' ') ||
      null;
    const guestName =
      guest?.name ??
      (row.guest_name as string | null) ??
      invName ??
      guest?.email?.split('@')[0] ??
      (row.guest_email as string | null)?.split('@')[0] ??
      inv?.guest_email?.split('@')[0] ??
      'Guest';

    requestedVisits.push({
      id: row.id as string,
      propertySlug: property.slug,
      propertyName: property.name,
      guestName,
      email:
        guest?.email ??
        (row.guest_email as string | null) ??
        inv?.guest_email ??
        null,
      avatarUrl: guest?.avatar_url ?? null,
      relationship: (row.relationship as string | null) ?? null,
      rooms: roomNames((row as { visit_rooms?: RoomJoin }).visit_rooms),
      partySize: (row.party_size as number | null) ?? 1,
      checkIn: dates?.check_in ?? '',
      checkOut: dates?.check_out ?? '',
    });
  }

  requestedVisits.sort((a, b) =>
    (a.checkIn || '9999-12-31').localeCompare(b.checkIn || '9999-12-31')
  );

  const pendingInvitations: ActionQueueInvite[] = [];
  for (const row of inviteRows ?? []) {
    const property = byId.get(row.property_id as string);
    if (!property) continue;

    const windows = (
      row as { invitation_windows?: { start_date: string; end_date: string }[] }
    ).invitation_windows;
    const firstWindow = windows?.[0];
    const guestName =
      (row.guest_name as string | null) ||
      [row.guest_first_name, row.guest_last_name].filter(Boolean).join(' ') ||
      (row.guest_email as string | null)?.split('@')[0] ||
      'Guest';

    pendingInvitations.push({
      id: row.id as string,
      propertySlug: property.slug,
      propertyName: property.name,
      token: row.token as string,
      guestName,
      email: (row.guest_email as string | null) ?? null,
      rooms: roomNames((row as { invitation_rooms?: RoomJoin }).invitation_rooms),
      maxGuests: roomCapacity(
        (row as { invitation_rooms?: RoomJoin }).invitation_rooms
      ),
      inviteType: (row.type as InvitationType | null) ?? 'standing',
      sentAt: (row.created_at as string | null) ?? '',
      expiresAt: (row.expires_at as string | null) ?? null,
      checkIn: firstWindow?.start_date ?? null,
      checkOut: firstWindow?.end_date ?? null,
    });
  }

  pendingInvitations.sort((a, b) =>
    (a.checkIn ?? '9999-12-31').localeCompare(b.checkIn ?? '9999-12-31')
  );

  return { requestedVisits, pendingInvitations };
}
