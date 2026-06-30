import { createAdminClient } from '@/lib/supabase/admin';
import type {
  VisitItem,
  InviteItem,
} from '@/components/dashboard/visits-hub';
import type { VisitStatus, Invitation, Property } from '@/types/database';

/** Minimal home context attached to every visit/invite so the (possibly
 * multi-home) hub can link to the right home and label each card. */
interface PropertyCtx {
  slug: string;
  name: string;
}

const VISIT_SELECT = `
  id, status, invitation_id, guest_name, guest_email, relationship, party_size, notes, property_id,
  guest:users!guest_user_id(name, email, avatar_url),
  dates:visit_dates(check_in, check_out),
  visit_rooms(room:rooms(name)),
  invitation:invitations(token, guest_name, guest_first_name, guest_last_name, guest_email)
`;

export interface VisitsHubData {
  visits: VisitItem[];
  invites: InviteItem[];
}

/**
 * Loads every visit and invitation across the given homes and shapes them for
 * the shared VisitsHub. Each item carries its home's slug + name so the hub can
 * render an account-wide, all-homes view (cards link and label per home).
 */
export async function loadVisitsHubData(
  properties: Property[]
): Promise<VisitsHubData> {
  if (properties.length === 0) return { visits: [], invites: [] };

  const admin = createAdminClient();
  const propertyIds = properties.map((p) => p.id);
  const ctxById = new Map<string, PropertyCtx>(
    properties.map((p) => [p.id, { slug: p.slug, name: p.name }])
  );

  const [{ data: visitRows }, { data: inviteRows }] = await Promise.all([
    admin
      .from('visits')
      .select(VISIT_SELECT)
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false }),
    admin
      .from('invitations')
      .select(
        '*, invitation_windows(start_date, end_date), invitation_rooms(room:rooms(name))'
      )
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false }),
  ]);

  // Batch-fetch avatars by email so account-holding guests show their photo
  // even on rows with no guest_user_id join (manual visits, invites).
  const emailSet = new Set<string>();
  for (const b of visitRows ?? []) {
    if (b.guest_email) emailSet.add((b.guest_email as string).toLowerCase());
  }
  for (const inv of inviteRows ?? []) {
    if (inv.guest_email) emailSet.add((inv.guest_email as string).toLowerCase());
  }
  const avatarByEmail = new Map<string, string | null>();
  if (emailSet.size > 0) {
    const { data: members } = await admin
      .from('users')
      .select('email, avatar_url')
      .in('email', Array.from(emailSet));
    for (const m of members ?? []) {
      avatarByEmail.set((m.email as string).toLowerCase(), m.avatar_url);
    }
  }

  const visits: VisitItem[] = [];
  for (const b of visitRows ?? []) {
    const ctx = ctxById.get(b.property_id as string);
    if (!ctx) continue;
    const dates = Array.isArray(b.dates) ? b.dates[0] : b.dates;
    if (!dates?.check_in || !dates?.check_out) continue;
    const guest = (Array.isArray(b.guest) ? b.guest[0] : b.guest) as
      | { name: string | null; email: string; avatar_url: string | null }
      | null;
    const inv = (Array.isArray(b.invitation)
      ? b.invitation[0]
      : b.invitation) as {
      token: string | null;
      guest_name: string | null;
      guest_first_name: string | null;
      guest_last_name: string | null;
      guest_email: string | null;
    } | null;
    const invName =
      inv?.guest_name ||
      [inv?.guest_first_name, inv?.guest_last_name].filter(Boolean).join(' ') ||
      null;
    const guestName =
      guest?.name ??
      (b.guest_name as string | null) ??
      invName ??
      guest?.email?.split('@')[0] ??
      (b.guest_email as string | null)?.split('@')[0] ??
      inv?.guest_email?.split('@')[0] ??
      'Guest';
    const rooms =
      (b.visit_rooms as { room: { name: string | null } | { name: string | null }[] | null }[] | null)?.map(
        (br) => {
          const room = Array.isArray(br.room) ? br.room[0] : br.room;
          return room?.name ?? 'Room';
        }
      ) ?? [];
    const email =
      guest?.email ?? (b.guest_email as string | null) ?? inv?.guest_email ?? null;
    visits.push({
      id: b.id as string,
      slug: ctx.slug,
      propertyName: ctx.name,
      guestName,
      email,
      avatarUrl:
        guest?.avatar_url ??
        (email ? (avatarByEmail.get(email.toLowerCase()) ?? null) : null),
      relationship: (b.relationship as string | null) ?? null,
      status: b.status as VisitStatus,
      checkIn: dates.check_in,
      checkOut: dates.check_out,
      partySize: b.party_size as number,
      rooms,
      isManual: !b.invitation_id,
      token: inv?.token ?? null,
      notes: (b.notes as string | null) ?? null,
    });
  }

  const invites: InviteItem[] = [];
  for (const inv of (inviteRows ?? []) as (Invitation & {
    invitation_windows?: { start_date: string; end_date: string }[];
    invitation_rooms?: {
      room: { name: string | null } | { name: string | null }[] | null;
    }[];
  })[]) {
    const ctx = ctxById.get(inv.property_id);
    if (!ctx) continue;
    const rooms =
      inv.invitation_rooms?.map((ir) => {
        const room = Array.isArray(ir.room) ? ir.room[0] : ir.room;
        return room?.name ?? 'Room';
      }) ?? [];
    invites.push({
      id: inv.id,
      slug: ctx.slug,
      propertyName: ctx.name,
      rooms,
      guestName: inv.guest_name ?? inv.guest_email,
      email: inv.guest_email,
      avatarUrl: avatarByEmail.get(inv.guest_email.toLowerCase()) ?? null,
      relationship: inv.relationship ?? null,
      status: inv.status,
      type: inv.type,
      token: inv.token,
      expiresAt: inv.expires_at,
      windows: (inv.invitation_windows ?? [])
        .map((w) => ({ start: w.start_date, end: w.end_date }))
        .sort((a, b) => a.start.localeCompare(b.start)),
    });
  }

  return { visits, invites };
}
