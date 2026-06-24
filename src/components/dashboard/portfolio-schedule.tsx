'use client';

import { startOfMonth } from 'date-fns';
import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';
import { VisitTimeline, type TimelineRow } from '@/components/visit-timeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toISODate } from '@/lib/dates';
import type {
  PortfolioCalendarVisit,
  PortfolioCalendarBlock,
} from '@/lib/portfolio';

// ~3 months of day columns, mirroring the 3-month calendar view.
const TIMELINE_DAYS = 92;

export function PortfolioSchedule({
  timelineRows,
  calendarVisits,
  calendarBlocks,
}: {
  timelineRows: TimelineRow[];
  calendarVisits: PortfolioCalendarVisit[];
  calendarBlocks: PortfolioCalendarBlock[];
}) {
  const timelineStart = toISODate(startOfMonth(new Date()));

  return (
    <Tabs defaultValue="calendar">
      <TabsList>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
      </TabsList>
      <TabsContent value="calendar" className="mt-6">
        <AvailabilityCalendar
          visits={calendarVisits}
          blocks={calendarBlocks}
          monthsToShow={3}
        />
      </TabsContent>
      <TabsContent value="timeline" className="mt-6">
        <VisitTimeline
          rows={timelineRows}
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
