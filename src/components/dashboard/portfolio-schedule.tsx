'use client';

import { useState } from 'react';
import { startOfMonth } from 'date-fns';
import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';
import { VisitTimeline, type TimelineRow } from '@/components/visit-timeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarSyncButton } from '@/components/dashboard/calendar-sync-button';
import { toISODate } from '@/lib/dates';
import type {
  PortfolioCalendarVisit,
  PortfolioCalendarBlock,
} from '@/lib/portfolio';

// ~3 months of day columns, mirroring the 3-month calendar view.
const TIMELINE_DAYS = 92;

const ALL_HOMES = 'all';

export function PortfolioSchedule({
  timelineRows,
  calendarVisits,
  calendarBlocks,
  houses = [],
  feedUrl,
}: {
  timelineRows: TimelineRow[];
  calendarVisits: PortfolioCalendarVisit[];
  calendarBlocks: PortfolioCalendarBlock[];
  /** Homes available to filter by; a toggle only appears with 2+. */
  houses?: { id: string; name: string }[];
  /** When set, shows a "subscribe to all homes" calendar control. */
  feedUrl?: string;
}) {
  const timelineStart = toISODate(startOfMonth(new Date()));
  const [house, setHouse] = useState<string>(ALL_HOMES);

  const showFilter = houses.length > 1;
  const selectedName =
    house === ALL_HOMES
      ? null
      : (houses.find((h) => h.id === house)?.name ?? null);

  const visits =
    house === ALL_HOMES
      ? calendarVisits
      : calendarVisits.filter((v) => v.propertyId === house);
  const blocks =
    house === ALL_HOMES
      ? calendarBlocks
      : calendarBlocks.filter((b) => b.propertyId === house);
  // Timeline rows are grouped by home name; filter to the selected group.
  const rows =
    house === ALL_HOMES || !selectedName
      ? timelineRows
      : timelineRows.filter((r) => r.group === selectedName);

  return (
    <Tabs defaultValue="calendar">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <TabsList>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          {showFilter && (
            <Select value={house} onValueChange={setHouse}>
              <SelectTrigger
                className="h-9 w-[min(100%,12rem)]"
                aria-label="Filter schedule by home"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_HOMES}>All homes</SelectItem>
                {houses.map((h) => (
                  <SelectItem key={h.id} value={h.id}>
                    {h.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {feedUrl && <CalendarSyncButton feedUrl={feedUrl} />}
        </div>
      </div>
      <TabsContent value="calendar" className="mt-6">
        <AvailabilityCalendar visits={visits} blocks={blocks} monthsToShow={3} />
      </TabsContent>
      <TabsContent value="timeline" className="mt-6">
        <VisitTimeline
          rows={rows}
          windowStart={timelineStart}
          windowDays={TIMELINE_DAYS}
          rowHeading="Homes & rooms"
          showMonths
          startAtToday
          showLegend
          emptyLabel="No visits scheduled yet."
        />
      </TabsContent>
    </Tabs>
  );
}
