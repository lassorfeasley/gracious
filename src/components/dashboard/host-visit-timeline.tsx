'use client';

import { useMemo } from 'react';
import { useVisit } from '@/components/guest/visit-context';
import {
  VisitTimeline,
  type TimelineRow,
  type TimelineStay,
} from '@/components/visit-timeline';

/**
 * Host-dashboard view of the visit timeline. Reads the live visit context
 * (all property rooms + their visits and owner blocks) and feeds it into the
 * shared {@link VisitTimeline}. One row per room; confirmed/pending visits and
 * owner blocks render as bands across a scrollable date window.
 */
export function HostVisitTimeline({
  windowStart,
  windowDays,
  visitHrefBase,
}: {
  windowStart: string;
  windowDays: number;
  /** If set, visit bands link to `${visitHrefBase}/${visitId}`. */
  visitHrefBase?: string;
}) {
  const { rooms, roomAvailability } = useVisit();

  const rows = useMemo<TimelineRow[]>(
    () =>
      rooms.map((room) => {
        const avail = roomAvailability[room.id];
        const stays: TimelineStay[] = [
          ...(avail?.visits ?? []).map((b) => ({
            id: `visit-${b.id}`,
            label: b.guestName,
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            variant: (b.pending ? 'pending' : 'confirmed') as TimelineStay['variant'],
            href: visitHrefBase ? `${visitHrefBase}/${b.id}` : undefined,
          })),
          ...(avail?.blocks ?? []).map((bl) => ({
            id: `block-${bl.id}`,
            label: 'Blocked',
            checkIn: bl.start_date,
            checkOut: bl.end_date,
            variant: 'blocked' as TimelineStay['variant'],
          })),
        ];
        return { id: room.id, label: room.name, stays };
      }),
    [rooms, roomAvailability, visitHrefBase]
  );

  return (
    <VisitTimeline
      rows={rows}
      windowStart={windowStart}
      windowDays={windowDays}
      showMonths
      startAtToday
      showLegend
      emptyLabel="No rooms yet — add a room to start scheduling visits."
    />
  );
}
