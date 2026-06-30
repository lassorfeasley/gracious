'use client';

import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';
import { useVisit } from './visit-context';

interface DateRange {
  start: string;
  end: string;
}

export function HouseCalendar({
  allowedRanges,
  monthsToShow = 2,
  disabled,
  visitHrefBase,
  openOnFirstVisit,
}: {
  allowedRanges?: DateRange[];
  monthsToShow?: number;
  disabled?: boolean;
  visitHrefBase?: string;
  openOnFirstVisit?: boolean;
}) {
  const {
    checkIn,
    checkOut,
    activeField,
    setRange,
    setActiveField,
    combinedVisits,
    combinedBlocks,
    rooms,
    roomAvailability,
  } = useVisit();

  return (
    <AvailabilityCalendar
      visits={combinedVisits}
      blocks={combinedBlocks}
      rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
      roomAvailability={roomAvailability}
      monthsToShow={monthsToShow}
      selectable={!disabled}
      value={{ checkIn, checkOut }}
      onChange={setRange}
      allowedRanges={allowedRanges}
      activeField={activeField}
      onActiveFieldChange={setActiveField}
      visitHrefBase={visitHrefBase}
      openOnFirstVisit={openOnFirstVisit}
    />
  );
}
