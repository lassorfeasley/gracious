'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { format, startOfDay } from 'date-fns';
import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';
import { formatDateRange } from '@/lib/dates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CancelVisitButton } from '@/components/guest/cancel-visit-button';
import { AddToCalendarButton } from '@/components/add-to-calendar-button';
import { PropertyNotesDisplay } from '@/components/property-notes-display';
import type { VisitStatus, PropertyNote } from '@/types/database';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  requested: 'secondary',
  approved: 'default',
  declined: 'destructive',
  cancelled: 'outline',
};

export interface TripVisit {
  id: string;
  status: VisitStatus;
  property: {
    name: string;
    slug: string;
    property_notes?: PropertyNote[];
  } | null;
  dates:
    | { check_in: string; check_out: string }
    | { check_in: string; check_out: string }[]
    | null;
  visit_rooms?: { room: { name: string } | null }[];
  invitation?: { token: string } | null;
}

function getVisitDates(visit: TripVisit) {
  if (!visit.dates) return null;
  return Array.isArray(visit.dates) ? visit.dates[0] : visit.dates;
}

function isUpcomingActive(visit: TripVisit, today: string) {
  const dates = getVisitDates(visit);
  if (!dates) return false;
  if (visit.status !== 'requested' && visit.status !== 'approved') return false;
  return dates.check_out >= today;
}

export function VisitsView({ visits }: { visits: TripVisit[] }) {
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');

  const upcomingVisits = useMemo(
    () => visits.filter((v) => isUpcomingActive(v, today)),
    [visits, today]
  );

  const calendarVisits = useMemo(
    () =>
      upcomingVisits
        .map((visit) => {
          const dates = getVisitDates(visit);
          if (!dates) return null;
          return {
            id: visit.id,
            guestName: visit.property?.name ?? 'Visit',
            checkIn: dates.check_in,
            checkOut: dates.check_out,
            pending: visit.status === 'requested',
          };
        })
        .filter((b): b is NonNullable<typeof b> => b !== null),
    [upcomingVisits]
  );

  if (!visits.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No visits yet.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open an invitation link from your host to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="list" className="mt-8">
      <TabsList>
        <TabsTrigger value="list">List</TabsTrigger>
        <TabsTrigger value="calendar">Calendar</TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="mt-6 space-y-4">
        {visits.map((visit) => {
          const dates = getVisitDates(visit);
          const rooms =
            visit.visit_rooms
              ?.map((br) => br.room?.name)
              .filter((name): name is string => !!name) ?? [];

          return (
            <Card key={visit.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">
                    {visit.property?.name}
                  </CardTitle>
                  <Badge variant={statusColors[visit.status] ?? 'outline'}>
                    {visit.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {dates && (
                  <p className="text-sm">
                    {formatDateRange(dates.check_in, dates.check_out)}
                  </p>
                )}
                {rooms.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Rooms: {rooms.join(', ')}
                  </p>
                )}
                {visit.status === 'approved' &&
                  visit.property?.property_notes &&
                  visit.property.property_notes.length > 0 && (
                    <PropertyNotesDisplay
                      notes={visit.property.property_notes}
                      categories={['house', 'checkin', 'checkout']}
                      headingAs="h3"
                      className="border-t pt-4"
                    />
                  )}
                <div className="flex flex-wrap gap-2">
                  {visit.status === 'approved' && (
                    <AddToCalendarButton visitId={visit.id} />
                  )}
                  {visit.invitation?.token && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/invite/${visit.invitation.token}`}>
                        View house
                      </Link>
                    </Button>
                  )}
                  {(visit.status === 'requested' ||
                    visit.status === 'approved') && (
                    <CancelVisitButton visitId={visit.id} />
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </TabsContent>

      <TabsContent value="calendar" className="mt-6">
        {calendarVisits.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No upcoming visits.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Approved and pending visits will appear on your calendar.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-2xl border p-6">
            <AvailabilityCalendar
              visits={calendarVisits}
              monthsToShow={2}
              selectable={false}
            />
          </div>
        )}
      </TabsContent>
    </Tabs>
  );
}
