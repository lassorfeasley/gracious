'use client';

import type { ReactNode } from 'react';
import { startOfMonth } from 'date-fns';
import { HouseCalendar } from '@/components/guest/house-calendar';
import { HostVisitTimeline } from '@/components/dashboard/host-visit-timeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarSyncButton } from '@/components/dashboard/calendar-sync-button';
import { toISODate } from '@/lib/dates';

/* Timeline window: from the start of the current month, spanning ~two months
 * to mirror the calendar's default two-month view (the rest scrolls). */
const TIMELINE_DAYS = 62;

export function HostCalendarSection({
  slug,
  sectionId,
  title,
  footer,
  className,
  calendarFeedUrl,
}: {
  slug: string;
  sectionId?: string;
  title?: string;
  footer?: ReactNode;
  className?: string;
  /** When set, shows a "Add to calendar" sync control beside the tabs. */
  calendarFeedUrl?: string;
}) {
  const visitHrefBase = `/dashboard/${slug}/visits`;
  const timelineStart = toISODate(startOfMonth(new Date()));

  return (
    <section
      id={sectionId}
      className={className ?? 'scroll-mt-28 py-10 first:pt-0'}
    >
      {title && (
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      )}
      <Tabs defaultValue="calendar" className={title ? 'mt-6' : 'mt-4'}>
        <div className="flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>
          {calendarFeedUrl && <CalendarSyncButton feedUrl={calendarFeedUrl} />}
        </div>
        <TabsContent value="calendar" className="mt-6">
          <HouseCalendar monthsToShow={2} visitHrefBase={visitHrefBase} />
        </TabsContent>
        <TabsContent value="timeline" className="mt-6">
          <HostVisitTimeline
            windowStart={timelineStart}
            windowDays={TIMELINE_DAYS}
            visitHrefBase={visitHrefBase}
          />
        </TabsContent>
      </Tabs>
      {footer}
    </section>
  );
}
