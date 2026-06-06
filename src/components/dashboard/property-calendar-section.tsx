import { createClient } from '@/lib/supabase/server';
import { mapPropertyBookingsToCalendar } from '@/lib/calendar-bookings';
import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';

export async function PropertyCalendarSection({
  propertyId,
  slug,
  title = 'Calendar',
  sectionId,
  monthsToShow = 2,
  footer,
  className,
}: {
  propertyId: string;
  slug: string;
  title?: string;
  sectionId?: string;
  monthsToShow?: number;
  footer?: React.ReactNode;
  className?: string;
}) {
  const supabase = await createClient();
  const { data: calendarRows } = await supabase
    .from('bookings')
    .select(
      `id, status, guest_name, guest_email, guest:users!guest_user_id(name, email), dates:booking_dates(check_in, check_out)`
    )
    .eq('property_id', propertyId)
    .in('status', ['approved', 'requested']);

  const calendarBookings = mapPropertyBookingsToCalendar(calendarRows ?? [], {
    includeRequested: true,
  });

  return (
    <section
      id={sectionId}
      className={className ?? 'scroll-mt-28 py-10 first:pt-0'}
    >
      {title && (
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      )}
      <div className={title ? 'mt-6' : undefined}>
        <AvailabilityCalendar
          bookings={calendarBookings}
          monthsToShow={monthsToShow}
          bookingHrefBase={`/dashboard/${slug}/bookings`}
        />
      </div>
      {footer}
    </section>
  );
}
