'use client';

import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      <InviteGuestDialog
        propertyId={propertyId}
        rooms={rooms}
        roomAvailability={roomAvailability}
        preselectedRoomIds={preselectedRoomIds}
        trigger={
          <Button size="sm" disabled={disabled}>
            <UserPlus className="mr-1 h-4 w-4" />
            Invite a guest
          </Button>
        }
      />
    </div>
  );
}
