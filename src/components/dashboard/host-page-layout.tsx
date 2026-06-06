'use client';

import type { ReactNode } from 'react';
import type { RoomAvailability } from '@/lib/guest-calendar';
import type { Room } from '@/types/database';
import { BookingProvider } from '@/components/guest/booking-context';
import { HostPageSidebar } from '@/components/dashboard/host-page-sidebar';
import { cn } from '@/lib/utils';

export function HostPageLayout({
  propertyId,
  rooms,
  roomAvailability,
  defaultSelectedRoomIds,
  lockRoomSelection = false,
  stickyTop = 'lg:top-28',
  className,
  preselectedRoomIds,
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
  children: ReactNode;
}) {
  const bookableRooms = rooms.map((r) => ({
    id: r.id,
    name: r.name,
    max_occupancy: r.max_occupancy,
  }));

  const allRoomIds = bookableRooms.map((r) => r.id);
  const selectedIds =
    defaultSelectedRoomIds?.filter((id) => allRoomIds.includes(id)) ??
    allRoomIds;

  return (
    <BookingProvider
      rooms={bookableRooms}
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
        <div className="min-w-0 divide-y">{children}</div>
        <aside className={cn('lg:sticky lg:self-start', stickyTop)}>
          <HostPageSidebar
            propertyId={propertyId}
            rooms={rooms}
            roomAvailability={roomAvailability}
            preselectedRoomIds={preselectedRoomIds ?? defaultSelectedRoomIds}
          />
        </aside>
      </div>
    </BookingProvider>
  );
}
