import Link from 'next/link';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardContainer } from '@/components/dashboard/dashboard-container';
import { PortfolioSchedule } from '@/components/dashboard/portfolio-schedule';
import { HouseCard } from '@/components/dashboard/portfolio-overview';
import { NextUpStrip } from '@/components/dashboard/next-up-strip';
import {
  DashboardInviteAction,
  type InviteHouse,
} from '@/components/dashboard/dashboard-invite-action';
import { DashboardNeedsYou } from '@/components/dashboard/dashboard-needs-you';
import type { PortfolioData, PortfolioArrival } from '@/lib/portfolio';
import type { HostActionQueue } from '@/lib/dashboard-home';

/**
 * One line under the greeting that answers "what does my week look like?"
 * before the host reads anything else.
 */
function greetingStatus(arrivals: PortfolioArrival[]): string {
  const today = new Date();
  const staying = arrivals.filter(
    (a) =>
      differenceInCalendarDays(parseISO(a.checkIn), today) <= 0 &&
      differenceInCalendarDays(parseISO(a.checkOut), today) >= 0
  );
  if (staying.length > 0) {
    const first = staying[0].guestName.split(/\s+/)[0];
    return staying.length === 1
      ? `${first} is staying with you right now.`
      : `${staying.length} guests are staying with you right now.`;
  }

  const thisWeek = arrivals.filter((a) => {
    const days = differenceInCalendarDays(parseISO(a.checkIn), today);
    return days >= 0 && days <= 7;
  });
  if (thisWeek.length === 1) {
    const a = thisWeek[0];
    const first = a.guestName.split(/\s+/)[0];
    return `${first} arrives ${format(parseISO(a.checkIn), 'EEEE')}.`;
  }
  if (thisWeek.length > 1) {
    return `${thisWeek.length} guests arriving this week.`;
  }

  if (arrivals.length > 0) {
    const a = arrivals[0];
    const first = a.guestName.split(/\s+/)[0];
    return `Next up: ${first} on ${format(parseISO(a.checkIn), 'MMM d')}.`;
  }

  return 'A quiet stretch ahead — a good time to invite someone.';
}

/**
 * The host home base: an action-first landing that's about the job-to-be-done
 * (confirm visits, invite guests) rather than "manage this house." The house
 * overview is now a thing you drill into from here, not the default surface.
 */
export function DashboardHome({
  firstName,
  portfolio,
  queue,
  accountFeedUrl,
}: {
  firstName?: string | null;
  portfolio: PortfolioData;
  queue: HostActionQueue;
  /** Combined all-homes calendar subscription URL. */
  accountFeedUrl?: string;
}) {
  const multiHome = portfolio.houses.length > 1;
  const inviteHouses: InviteHouse[] = portfolio.houses.map((h) => ({
    id: h.property.id,
    name: h.property.name,
    rooms: h.rooms,
    roomAvailability: h.roomAvailability,
  }));
  const scheduleHouses = portfolio.houses.map((h) => ({
    id: h.property.id,
    name: h.property.name,
  }));

  const arrivals = portfolio.nextArrivals;
  const hasSchedule =
    portfolio.calendarVisits.length > 0 || portfolio.calendarBlocks.length > 0;

  return (
    <DashboardContainer width="standard">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {firstName ? `Welcome back, ${firstName}` : 'Your dashboard'}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {greetingStatus(arrivals)}
          </p>
        </div>
        <DashboardInviteAction houses={inviteHouses} />
      </div>

      <div className="mt-10">
        <DashboardNeedsYou
          requestedVisits={queue.requestedVisits}
          pendingInvitations={queue.pendingInvitations}
          houses={inviteHouses}
        />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Schedule</h2>

        {arrivals.length > 0 && (
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-brass">
              Next up
            </p>
            <div className="mt-3">
              <NextUpStrip arrivals={arrivals} showHouse={multiHome} />
            </div>
          </div>
        )}

        {hasSchedule ? (
          <div className="mt-6">
            <PortfolioSchedule
              timelineRows={portfolio.timelineRows}
              calendarVisits={portfolio.calendarVisits}
              calendarBlocks={portfolio.calendarBlocks}
              houses={scheduleHouses}
              feedUrl={accountFeedUrl}
            />
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">
            Nothing on the calendar yet — your first confirmed visit will show
            up here.
          </p>
        )}
      </div>

      <div className="mt-14">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold tracking-tight">
            {multiHome ? 'Your homes' : 'Your home'}
          </h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/add-home">
              <Plus className="mr-1 h-4 w-4" />
              Add home
            </Link>
          </Button>
        </div>
        <div className="mt-6 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {portfolio.houses.map((house) => (
            <Link
              key={house.property.id}
              href={`/dashboard/${house.property.slug}/overview`}
              className="group block"
            >
              <HouseCard house={house} />
            </Link>
          ))}
        </div>
      </div>
    </DashboardContainer>
  );
}
