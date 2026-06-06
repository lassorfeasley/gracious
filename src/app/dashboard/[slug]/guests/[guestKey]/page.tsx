import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDashboardProperty } from '@/lib/dashboard-property';
import { buildGuestRoster, findRosterEntry } from '@/lib/guest-roster';
import { parseGuestKey } from '@/lib/guest-keys';
import { GuestProfileView } from '@/components/dashboard/guest-profile-view';
import type { Invitation } from '@/types/database';

export default async function GuestProfilePage({
  params,
}: {
  params: Promise<{ slug: string; guestKey: string }>;
}) {
  const { slug, guestKey } = await params;
  if (!parseGuestKey(guestKey)) notFound();

  const property = await getDashboardProperty(slug);
  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('property_id', property.id);

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      `
      id, status, invitation_id, guest_name, guest_email, guest_phone, party_size, notes,
      guest:users!guest_user_id(name, email),
      dates:booking_dates(check_in, check_out),
      booking_rooms(room:rooms(name)),
      invitation:invitations(*)
    `
    )
    .eq('property_id', property.id)
    .order('created_at', { ascending: false });

  const roster = buildGuestRoster(
    (invitations ?? []) as Invitation[],
    bookings ?? [],
    today
  );
  const guest = findRosterEntry(roster, guestKey);
  if (!guest) notFound();

  return <GuestProfileView guest={guest} slug={slug} today={today} />;
}
