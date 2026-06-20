import { createAdminClient } from '@/lib/supabase/admin';
import { datesOverlap } from '@/lib/dates';
import type { User } from '@/types/database';

export interface CoGuestDisplay {
  visible: { label: string; name: string }[];
  hasHidden: boolean;
}

function formatDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'Guest';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase() ?? '';
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

function formatGuestName(user: User): string {
  return formatDisplayName(user.name ?? 'Guest');
}

export async function getCoGuestsForDates(
  propertyId: string,
  checkIn: string,
  checkOut: string,
  excludeUserId?: string,
  forOwner = false
): Promise<CoGuestDisplay> {
  const admin = createAdminClient();

  const { data: approvedVisits } = await admin
    .from('visits')
    .select(
      `
      guest_user_id,
      guest_name,
      guest_email,
      guest:users!guest_user_id(id, name, visible_to_coguests),
      dates:visit_dates(check_in, check_out)
    `
    )
    .eq('property_id', propertyId)
    .eq('status', 'approved');

  const visible: { label: string; name: string }[] = [];
  let hasHidden = false;

  for (const visit of approvedVisits ?? []) {
    if (visit.guest_user_id === excludeUserId) continue;

    const dates = Array.isArray(visit.dates)
      ? visit.dates[0]
      : visit.dates;
    if (!dates) continue;

    if (
      !datesOverlap(checkIn, checkOut, dates.check_in, dates.check_out)
    )
      continue;

    if (visit.guest_user_id) {
      const guest = (Array.isArray(visit.guest)
        ? visit.guest[0]
        : visit.guest) as User | null;
      if (!guest) continue;
      if (!forOwner && !guest.visible_to_coguests) {
        hasHidden = true;
        continue;
      }
      visible.push({
        label: formatGuestName(guest),
        name: guest.name ?? 'Guest',
      });
    } else {
      const name =
        visit.guest_name ??
        visit.guest_email?.split('@')[0] ??
        'Guest';
      visible.push({
        label: formatDisplayName(name),
        name,
      });
    }
  }

  return { visible, hasHidden };
}

export async function getCoGuestsForInvitation(
  propertyId: string,
  windows: { start_date: string; end_date: string }[],
  excludeUserId?: string
): Promise<CoGuestDisplay> {
  if (windows.length === 0) {
    const farFuture = '2099-12-31';
    const today = new Date().toISOString().split('T')[0];
    return getCoGuestsForDates(propertyId, today, farFuture, excludeUserId);
  }

  const merged: CoGuestDisplay = { visible: [], hasHidden: false };
  const seen = new Set<string>();

  for (const w of windows) {
    const result = await getCoGuestsForDates(
      propertyId,
      w.start_date,
      w.end_date,
      excludeUserId
    );
    for (const g of result.visible) {
      if (!seen.has(g.name)) {
        seen.add(g.name);
        merged.visible.push(g);
      }
    }
    if (result.hasHidden) merged.hasHidden = true;
  }

  return merged;
}
