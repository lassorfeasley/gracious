'use client';

import { CalendarPlus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HostBookingDialog } from '@/components/dashboard/host-booking-dialog';
import { InviteGuestDialog } from '@/components/dashboard/invite-guest-dialog';
import type { RoomAvailability } from '@/lib/guest-calendar';
import type { Room } from '@/types/database';

export function ComposePageActions({
  propertyId,
  rooms,
  roomAvailability,
  preselectedRoomIds,
}: {
  propertyId: string;
  rooms: Room[];
  roomAvailability: Record<string, RoomAvailability>;
  preselectedRoomIds?: string[];
}) {
  const disabled = rooms.length === 0;

  return (
    <div className="flex flex-wrap gap-2">
      <HostBookingDialog
        propertyId={propertyId}
        rooms={rooms}
        roomAvailability={roomAvailability}
        trigger={
          <Button variant="outline" size="sm" disabled={disabled}>
            <CalendarPlus className="mr-1 h-4 w-4" />
            Manual stay
          </Button>
        }
      />
      <InviteGuestDialog
        propertyId={propertyId}
        rooms={rooms}
        preselectedRoomIds={preselectedRoomIds}
        trigger={
          <Button size="sm" disabled={disabled}>
            <UserPlus className="mr-1 h-4 w-4" />
            Invite guest
          </Button>
        }
      />
    </div>
  );
}
