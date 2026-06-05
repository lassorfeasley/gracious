'use client';

import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';
import { useBooking } from './booking-context';

interface CalendarBooking {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
}

interface CalendarBlock {
  id: string;
  start_date: string;
  end_date: string;
}

interface DateRange {
  start: string;
  end: string;
}

export function SelectableRoomCalendar({
  bookings,
  blocks,
  allowedRanges,
  disabled,
  monthsToShow,
}: {
  bookings: CalendarBooking[];
  blocks: CalendarBlock[];
  allowedRanges?: DateRange[];
  disabled?: boolean;
  monthsToShow?: number;
}) {
  const { checkIn, checkOut, activeField, setRange, setActiveField } =
    useBooking();

  return (
    <AvailabilityCalendar
      bookings={bookings}
      blocks={blocks}
      monthsToShow={monthsToShow}
      selectable={!disabled}
      value={{ checkIn, checkOut }}
      onChange={setRange}
      allowedRanges={allowedRanges}
      activeField={activeField}
      onActiveFieldChange={setActiveField}
    />
  );
}
