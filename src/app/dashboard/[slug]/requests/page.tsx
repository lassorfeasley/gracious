import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import { getDashboardProperty } from '@/lib/dashboard-property';
import { mapPropertyBookingsToCalendar } from '@/lib/calendar-bookings';
import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';
import { BookingRequests } from '@/components/dashboard/booking-requests';
import { getInvitationRoomAvailability } from '@/lib/guest-availability';
import { ComposePageActions } from '@/components/dashboard/compose-page-actions';
import { DashboardContainer } from '@/components/dashboard/dashboard-container';

export const metadata = { title: 'Requests' };

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

  // Apply one-click email actions before fetching, so the page reflects the
  // result of the action instead of the stale pending state.
  let quickActionResult: { ok: boolean; message: string } | null = null;
  if (sp.booking && sp.action) {
    const user = await getCurrentUser();
    if (user) {
      quickActionResult = await handleQuickAction(
        property.id,
        user.id,
        sp.booking,
        sp.action
      );
    }
  }

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
    <DashboardContainer width="standard" className="space-y-10">
      {quickActionResult && (
        <div
          className={
            quickActionResult.ok
              ? 'rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900'
              : 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900'
          }
        >
          {quickActionResult.message}
        </div>
      )}
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
    </DashboardContainer>
  );
}

async function handleQuickAction(
  propertyId: string,
  actorUserId: string,
  bookingId: string,
  action: string
): Promise<{ ok: boolean; message: string } | null> {
  if (action !== 'approve' && action !== 'decline') return null;
  const { approveBooking, declineBooking } = await import(
    '@/lib/booking-actions'
  );

  // Scope by propertyId so a tampered booking id from an email link can't act
  // on a stay this host doesn't manage. The shared action also enforces the
  // pending-only guard, so a refresh of an already-handled request is a no-op.
  const result =
    action === 'approve'
      ? await approveBooking(bookingId, actorUserId, { propertyId })
      : await declineBooking(bookingId, actorUserId, { propertyId });

  if (!result.ok) {
    if (result.reason === 'limit_reached') {
      return {
        ok: false,
        message:
          'You’ve reached your plan’s hosted-stay limit — upgrade to approve more stays.',
      };
    }
    return {
      ok: false,
      message:
        'This request has already been handled — see its current status below.',
    };
  }

  return {
    ok: true,
    message:
      action === 'approve'
        ? 'Request approved — the guest has been notified.'
        : 'Request declined — the guest has been notified.',
  };
}
