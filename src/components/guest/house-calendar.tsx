'use client';

import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';
import { useBooking } from './booking-context';

interface DateRange {
  start: string;
  end: string;
}

export function HouseCalendar({
  allowedRanges,
  monthsToShow = 2,
  disabled,
  bookingHrefBase,
}: {
  allowedRanges?: DateRange[];
  monthsToShow?: number;
  disabled?: boolean;
  bookingHrefBase?: string;
}) {
  const {
    checkIn,
    checkOut,
    activeField,
    setRange,
    setActiveField,
    combinedBookings,
    combinedBlocks,
  } = useBooking();

  return (
    <AvailabilityCalendar
      bookings={combinedBookings}
      blocks={combinedBlocks}
      monthsToShow={monthsToShow}
      selectable={!disabled}
      value={{ checkIn, checkOut }}
      onChange={setRange}
      allowedRanges={allowedRanges}
      activeField={activeField}
      onActiveFieldChange={setActiveField}
      bookingHrefBase={bookingHrefBase}
    />
  );
}
