import { createClient } from '@/lib/supabase/server';
import { getDashboardProperty } from '@/lib/dashboard-property';
import { buildGuestRoster } from '@/lib/guest-roster';
import { getInvitationRoomAvailability } from '@/lib/guest-availability';
import { GuestsScheduleView } from '@/components/dashboard/guests-schedule-view';
import { GuestsTable } from '@/components/dashboard/guests-table';
import { ComposePageActions } from '@/components/dashboard/compose-page-actions';
import { buildScheduleStays } from '@/lib/schedule-stays';
import type { Invitation } from '@/types/database';

export default async function GuestsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getDashboardProperty(slug);
  const today = new Date().toISOString().split('T')[0];

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
    bookings ?? [],
    today
  );

  const upcomingCount = roster.filter((g) => g.upcomingStay).length;
  const invitedCount = roster.filter(
    (g) => g.invitation?.status === 'pending' && !g.upcomingStay
  ).length;
  const scheduleStays = buildScheduleStays(roster);
  const roomAvailability = await getInvitationRoomAvailability(
    (rooms ?? []).map((r) => r.id)
  );

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Guests & bookings
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage stays, invitations, and everyone who has visited
          </p>
          {roster.length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground">
              {roster.length} {roster.length === 1 ? 'person' : 'people'}
              {upcomingCount > 0 && ` · ${upcomingCount} upcoming`}
              {invitedCount > 0 && ` · ${invitedCount} invited`}
            </p>
          )}
        </div>
        <ComposePageActions
          propertyId={property.id}
          rooms={rooms ?? []}
          roomAvailability={roomAvailability}
        />
      </div>

      {rooms?.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Add rooms before inviting guests or adding manual stays.
        </div>
      )}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Schedule</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Pick a day to see who&apos;s arriving, staying, or departing.
          </p>
        </div>
        <GuestsScheduleView slug={slug} stays={scheduleStays} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">All guests</h2>
        <GuestsTable guests={roster} slug={slug} />
      </section>
    </div>
  );
}
