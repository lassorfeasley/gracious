import { createClient } from '@/lib/supabase/server';
import { getDashboardProperty } from '@/lib/dashboard-property';
import { buildGuestRoster } from '@/lib/guest-roster';
import { UpcomingGuestTiles } from '@/components/dashboard/upcoming-guest-tiles';
import { GuestsTable } from '@/components/dashboard/guests-table';
import { ComposePageActions } from '@/components/dashboard/compose-page-actions';
import type { Invitation } from '@/types/database';

export default async function GuestsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getDashboardProperty(slug);

  const supabase = await createClient();
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('property_id', property.id)
    .order('display_order');

  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('property_id', property.id)
    .order('created_at', { ascending: false });

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
    bookings ?? []
  );

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Guests</h1>
          <p className="mt-1 text-muted-foreground">
            Upcoming stays, invitations, and everyone who has visited
          </p>
        </div>
        <ComposePageActions slug={slug} rooms={rooms ?? []} />
      </div>

      {rooms?.length === 0 && (
        <p className="text-sm text-amber-600">
          Add rooms before inviting guests or adding manual stays.
        </p>
      )}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Upcoming</h2>
        <UpcomingGuestTiles guests={roster} slug={slug} />
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">All guests</h2>
          <p className="text-sm text-muted-foreground">
            {roster.length} {roster.length === 1 ? 'person' : 'people'}
          </p>
        </div>
        <GuestsTable guests={roster} slug={slug} />
      </section>
    </div>
  );
}
