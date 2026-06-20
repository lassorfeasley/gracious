'use client';

import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';
import { useVisit } from './visit-context';

interface CalendarVisit {
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
  visits,
  blocks,
  allowedRanges,
  disabled,
  monthsToShow,
}: {
  visits: CalendarVisit[];
  blocks: CalendarBlock[];
  allowedRanges?: DateRange[];
  disabled?: boolean;
  monthsToShow?: number;
}) {
  const { checkIn, checkOut, activeField, setRange, setActiveField } =
    useVisit();

  return (
    <AvailabilityCalendar
      visits={visits}
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
