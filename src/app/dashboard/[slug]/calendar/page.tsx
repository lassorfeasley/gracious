import { createClient } from '@/lib/supabase/server';
import { getDashboardProperty } from '@/lib/dashboard-property';
import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';
import { InviteGuestDialog } from '@/components/dashboard/invite-guest-dialog';
import { assignColors } from '@/lib/calendar-colors';

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getDashboardProperty(slug);

  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      `id, status, guest_name, guest_email, guest:users!guest_user_id(name, email), dates:booking_dates(check_in, check_out)`
    )
    .eq('property_id', property.id)
    .in('status', ['approved', 'requested']);

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('property_id', property.id)
    .order('display_order');

  const calendarBookings = assignColors(
    (bookings ?? [])
      .filter((b) => b.status === 'approved')
      .map((b) => {
        const dates = Array.isArray(b.dates) ? b.dates[0] : b.dates;
        const guest = (Array.isArray(b.guest) ? b.guest[0] : b.guest) as
          | { name: string | null; email: string }
          | null;
        const guestName =
          guest?.name ??
          guest?.email?.split('@')[0] ??
          b.guest_name ??
          b.guest_email?.split('@')[0] ??
          'Guest';
        return {
          id: b.id,
          guestName,
          checkIn: dates?.check_in ?? '',
          checkOut: dates?.check_out ?? '',
        };
      })
      .filter((b) => b.checkIn && b.checkOut)
  );

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="mt-1 text-muted-foreground">Approved stays across your home</p>
        </div>
        <InviteGuestDialog propertyId={property.id} rooms={rooms ?? []} />
      </div>
      <AvailabilityCalendar bookings={calendarBookings} />
    </div>
  );
}
