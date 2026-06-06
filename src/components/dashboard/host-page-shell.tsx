import { getInvitationRoomAvailability } from '@/lib/guest-availability';
import { HostPageLayout } from '@/components/dashboard/host-page-layout';
import type { Room } from '@/types/database';

/** Two-column layout: scrollable page content + sticky booking sidebar. */
export async function HostPageShell({
  propertyId,
  rooms,
  defaultSelectedRoomIds,
  lockRoomSelection = false,
  preselectedRoomIds,
  className,
  children,
}: {
  propertyId: string;
  rooms: Room[];
  defaultSelectedRoomIds?: string[];
  lockRoomSelection?: boolean;
  preselectedRoomIds?: string[];
  className?: string;
  children: React.ReactNode;
}) {
  if (rooms.length === 0) return <>{children}</>;

  const roomAvailability = await getInvitationRoomAvailability(
    rooms.map((r) => r.id)
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
    >
      {children}
    </HostPageLayout>
  );
}
