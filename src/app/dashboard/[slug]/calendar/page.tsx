import { createClient } from '@/lib/supabase/server';
import { startOfMonth } from 'date-fns';
import {
  PropertyCalendar,
  assignColors,
} from '@/components/dashboard/property-calendar';

async function getProperty(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('properties').select('id, name').eq('slug', slug).single();
  return data;
}

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return null;

  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      `id, status, guest:users!guest_user_id(name, email), dates:booking_dates(check_in, check_out)`
    )
    .eq('property_id', property.id)
    .in('status', ['approved', 'requested']);

  const calendarBookings = assignColors(
    (bookings ?? [])
      .filter((b) => b.status === 'approved')
      .map((b) => {
        const dates = Array.isArray(b.dates) ? b.dates[0] : b.dates;
        const guest = (Array.isArray(b.guest) ? b.guest[0] : b.guest) as {
          name: string | null;
          email: string;
        };
        return {
          id: b.id,
          guestName: guest.name ?? guest.email.split('@')[0],
          checkIn: dates?.check_in ?? '',
          checkOut: dates?.check_out ?? '',
        };
      })
      .filter((b) => b.checkIn && b.checkOut)
  );

  const month = startOfMonth(new Date());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Calendar</h1>
        <p className="text-muted-foreground">
          {new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' }).format(month)}
        </p>
      </div>
      <PropertyCalendar month={month} bookings={calendarBookings} />
    </div>
  );
}
