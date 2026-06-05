import { getInvitationRoomAvailability } from '@/lib/guest-availability';
import {
  HostComposePanel,
  HostComposeSplitGrid,
} from '@/components/dashboard/stay-compose';
import type { Room } from '@/types/database';

/** Wraps page content in a two-column grid with a sticky host booking sidebar. */
export async function HostBookingShell({
  propertyId,
  slug,
  rooms,
  defaultSelectedRoomIds,
  lockRoomSelection = false,
  initialMode = 'invite',
  className,
  children,
}: {
  propertyId: string;
  slug: string;
  rooms: Room[];
  defaultSelectedRoomIds?: string[];
  lockRoomSelection?: boolean;
  initialMode?: 'invite' | 'manual';
  className?: string;
  children: React.ReactNode;
}) {
  if (rooms.length === 0) return <>{children}</>;

  const roomAvailability = await getInvitationRoomAvailability(
    rooms.map((r) => r.id)
  );

  return (
    <HostComposePanel
      propertyId={propertyId}
      slug={slug}
      rooms={rooms}
      roomAvailability={roomAvailability}
      variant="split"
      initialMode={initialMode}
      defaultSelectedRoomIds={defaultSelectedRoomIds}
      lockRoomSelection={lockRoomSelection}
    >
      <HostComposeSplitGrid className={className}>{children}</HostComposeSplitGrid>
    </HostComposePanel>
  );
}
