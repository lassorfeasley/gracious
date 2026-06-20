import { getInvitationRoomAvailability } from '@/lib/guest-availability';
import { HostPageLayout, type InvitationUsageSummary } from '@/components/dashboard/host-page-layout';
import { AddRoomSidebar } from '@/components/dashboard/add-room-sidebar';
import { MobileDockedCard } from '@/components/mobile-docked-card';
import { VisitProvider } from '@/components/guest/visit-context';
import { cn } from '@/lib/utils';
import type { Room } from '@/types/database';

/** Two-column layout: scrollable page content + sticky visit sidebar. */
export async function HostPageShell({
  propertyId,
  rooms,
  defaultSelectedRoomIds,
  lockRoomSelection = false,
  preselectedRoomIds,
  className,
  leading,
  invitationUsage,
  children,
}: {
  propertyId: string;
  rooms: Room[];
  defaultSelectedRoomIds?: string[];
  lockRoomSelection?: boolean;
  preselectedRoomIds?: string[];
  className?: string;
  /** Optional content rendered atop the left column, above the divided sections. */
  leading?: React.ReactNode;
  invitationUsage?: InvitationUsageSummary;
  children: React.ReactNode;
}) {
  // No rooms yet (e.g. a freshly created home): the visit sidebar can't be
  // used, so show an "add your first room" call to action in its place. Still
  // provide the visit context so calendar children don't crash.
  if (rooms.length === 0) {
    const addRoomSidebar = <AddRoomSidebar propertyId={propertyId} />;
    return (
      <VisitProvider>
        <div
          className={cn(
            'grid gap-x-12 gap-y-12 lg:grid-cols-[1fr_360px]',
            className
          )}
        >
          <div className="min-w-0">
            {leading}
            <div className={cn('divide-y', leading && 'mt-2')}>{children}</div>
          </div>
          <aside className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
            {addRoomSidebar}
          </aside>
        </div>
        <MobileDockedCard
          ctaLabel="Add a room"
          idleTitle="Add your first room"
          idleSubtitle="Rooms are required to take visits"
        >
          {addRoomSidebar}
        </MobileDockedCard>
      </VisitProvider>
    );
  }

  const roomAvailability = await getInvitationRoomAvailability(
    rooms.map((r) => r.id),
    { includeGuestNames: true }
  );

  return (
    <HostPageLayout
      propertyId={propertyId}
      rooms={rooms}
      roomAvailability={roomAvailability}
      defaultSelectedRoomIds={defaultSelectedRoomIds}
      lockRoomSelection={lockRoomSelection}
      preselectedRoomIds={preselectedRoomIds}
      className={className}
      leading={leading}
      invitationUsage={invitationUsage}
    >
      {children}
    </HostPageLayout>
  );
}
