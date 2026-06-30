import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DashboardContainer } from '@/components/dashboard/dashboard-container';
import { PortfolioSchedule } from '@/components/dashboard/portfolio-schedule';
import { HouseCard } from '@/components/dashboard/portfolio-overview';
import {
  DashboardInviteAction,
  type InviteHouse,
} from '@/components/dashboard/dashboard-invite-action';
import { DashboardNeedsYou } from '@/components/dashboard/dashboard-needs-you';
import type { PortfolioData } from '@/lib/portfolio';
import type { HostActionQueue } from '@/lib/dashboard-home';

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

  return (
    <DashboardContainer width="standard">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            {firstName ? `Welcome back, ${firstName}` : 'Your dashboard'}
          </h1>
        </div>
        <DashboardInviteAction houses={inviteHouses} />
      </div>

      <div className="mt-10">
        <DashboardNeedsYou
          requestedVisits={queue.requestedVisits}
          pendingInvitations={queue.pendingInvitations}
        />
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-semibold tracking-tight">Schedule</h2>
        <div className="mt-6">
          <PortfolioSchedule
            timelineRows={portfolio.timelineRows}
            calendarVisits={portfolio.calendarVisits}
            calendarBlocks={portfolio.calendarBlocks}
            houses={scheduleHouses}
            feedUrl={accountFeedUrl}
          />
        </div>
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
