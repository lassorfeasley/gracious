import { getInvitationRoomAvailability } from '@/lib/guest-availability';
import { HostPageLayout } from '@/components/dashboard/host-page-layout';
import { BookingProvider } from '@/components/guest/booking-context';
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
  // No rooms yet (e.g. a freshly created home): skip the sidebar layout, but
  // still provide the booking context so calendar children don't crash.
  if (rooms.length === 0) {
    return <BookingProvider>{children}</BookingProvider>;
  }

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
