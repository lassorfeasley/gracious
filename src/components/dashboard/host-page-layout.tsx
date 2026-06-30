'use client';

import type { ReactNode } from 'react';
import type { RoomAvailability } from '@/lib/guest-calendar';
import type { Room } from '@/types/database';
import { VisitProvider } from '@/components/guest/visit-context';
import { HostPageSidebar } from '@/components/dashboard/host-page-sidebar';
import { MobileDockedCard } from '@/components/mobile-docked-card';
import { InvitationUsageBanner } from '@/components/dashboard/invitation-usage-banner';
import { cn } from '@/lib/utils';

export interface InvitationUsageSummary {
  remaining: number;
  limit: number;
  settingsPath: string;
}

export function HostPageLayout({
  propertyId,
  rooms,
  roomAvailability,
  defaultSelectedRoomIds,
  lockRoomSelection = false,
  stickyTop = 'lg:top-28',
  className,
  preselectedRoomIds,
  leading,
  invitationUsage,
  children,
}: {
  propertyId: string;
  rooms: Room[];
  roomAvailability: Record<string, RoomAvailability>;
  defaultSelectedRoomIds?: string[];
  lockRoomSelection?: boolean;
  stickyTop?: string;
  className?: string;
  preselectedRoomIds?: string[];
  /** Optional content rendered atop the left column, above the divided sections. */
  leading?: ReactNode;
  invitationUsage?: InvitationUsageSummary;
  children: ReactNode;
}) {
  const requestableRooms = rooms.map((r) => ({
    id: r.id,
    name: r.name,
    max_occupancy: r.max_occupancy,
  }));

  const allRoomIds = requestableRooms.map((r) => r.id);
  const selectedIds =
    defaultSelectedRoomIds?.filter((id) => allRoomIds.includes(id)) ??
    allRoomIds;

  const sidebar = (
    <HostPageSidebar
      propertyId={propertyId}
      rooms={rooms}
      roomAvailability={roomAvailability}
      preselectedRoomIds={preselectedRoomIds ?? defaultSelectedRoomIds}
      headerSlot={
        invitationUsage ? (
          <InvitationUsageBanner
            remaining={invitationUsage.remaining}
            limit={invitationUsage.limit}
            settingsPath={invitationUsage.settingsPath}
          />
        ) : undefined
      }
    />
  );

  return (
    <VisitProvider
      rooms={requestableRooms}
      roomAvailability={roomAvailability}
      defaultGuests={1}
      defaultSelectedRoomIds={selectedIds}
      lockRoomSelection={lockRoomSelection}
    >
      <div
        className={cn(
          'grid gap-x-12 gap-y-12 lg:grid-cols-[1fr_360px]',
          className
        )}
      >
        <div className="min-w-0">
          {leading && (
            <div className="border-b border-border/60 pb-8">{leading}</div>
          )}
          <div className={cn('divide-y', leading && '[&>section:first-child]:pt-10')}>
            {children}
          </div>
        </div>
        {/* Desktop only; mobile docks the same card to the bottom of the screen. */}
        <aside
          className={cn('hidden lg:sticky lg:block lg:self-start', stickyTop)}
        >
          {sidebar}
        </aside>
      </div>

      <MobileDockedCard
        ctaLabel="Invite a guest"
        idleTitle="Invite a guest"
        idleSubtitle="Pick your dates to request a visit"
        trackDates
      >
        {sidebar}
      </MobileDockedCard>
    </VisitProvider>
  );
}
