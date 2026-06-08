import { createClient } from '@/lib/supabase/server';
import { getDashboardProperty } from '@/lib/dashboard-property';
import { mapPropertyBookingsToCalendar } from '@/lib/calendar-bookings';
import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';
import { BookingRequests } from '@/components/dashboard/booking-requests';
import { getInvitationRoomAvailability } from '@/lib/guest-availability';
import { ComposePageActions } from '@/components/dashboard/compose-page-actions';

export default async function RequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ booking?: string; action?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const property = await getDashboardProperty(slug);

  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      `id, status, invitation_id, guest_name, guest_email, party_size, notes, created_by,
      guest:users!guest_user_id(name, email),
      dates:booking_dates(check_in, check_out),
      booking_rooms(room:rooms(name))`
    )
    .eq('property_id', property.id)
    .order('created_at', { ascending: false });

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('property_id', property.id)
    .order('display_order');

  const { data: calendarRows } = await supabase
    .from('bookings')
    .select(
      `id, status, guest_name, guest_email, guest:users!guest_user_id(name, email), dates:booking_dates(check_in, check_out)`
    )
    .eq('property_id', property.id)
    .in('status', ['approved', 'requested']);

  const calendarBookings = mapPropertyBookingsToCalendar(calendarRows ?? [], {
    includeRequested: true,
  });

  const pendingCount = (bookings ?? []).filter(
    (b) => b.status === 'requested'
  ).length;

  const roomAvailability = await getInvitationRoomAvailability(
    (rooms ?? []).map((r) => r.id),
    { includeGuestNames: true }
  );

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Requests</h1>
          <p className="mt-1 text-muted-foreground">
            {pendingCount > 0
              ? `${pendingCount} stay request${pendingCount === 1 ? '' : 's'} waiting for you`
              : 'Review stay requests and see what’s on the calendar'}
          </p>
        </div>
        <ComposePageActions
          propertyId={property.id}
          rooms={rooms ?? []}
          roomAvailability={roomAvailability}
        />
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Calendar</h2>
        <AvailabilityCalendar
          bookings={calendarBookings}
          bookingHrefBase={`/dashboard/${slug}/bookings`}
        />
      </section>

      <BookingRequests bookings={bookings ?? []} slug={slug} />

      {sp.booking && sp.action && (
        <QuickActionHandler bookingId={sp.booking} action={sp.action} />
      )}
    </div>
  );
}

async function QuickActionHandler({
  bookingId,
  action,
}: {
  bookingId: string;
  action: string;
}) {
  if (action !== 'approve' && action !== 'decline') return null;
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const { notifyBookingApproved, notifyBookingDeclined } = await import(
    '@/lib/email/notifications'
  );
  const admin = createAdminClient();
  const status = action === 'approve' ? 'approved' : 'declined';
  await admin.from('bookings').update({ status }).eq('id', bookingId);
  if (action === 'approve') {
    notifyBookingApproved(bookingId).catch(console.error);
  } else {
    notifyBookingDeclined(bookingId).catch(console.error);
  }
  return null;
}
