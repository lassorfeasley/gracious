'use client';

import { Plus, DoorOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { RoomEditDialog } from '@/components/dashboard/room-edit-dialog';
import { useBareCard } from '@/components/card-chrome';

/**
 * Sidebar shown on a property with no rooms yet. Replaces the visit sidebar
 * (which can't be used without rooms) with a call to action to add the first room.
 */
export function AddRoomSidebar({ propertyId }: { propertyId: string }) {
  const bare = useBareCard();
  return (
    <div className="space-y-4">
      <div
        className={cn(
          'p-6',
          !bare && 'rounded-2xl shadow-[0_6px_16px_rgba(0,0,0,0.12)]'
        )}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <DoorOpen className="h-6 w-6 text-foreground" />
        </div>
        <p className="mt-4 text-xl font-semibold">Add your first room</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Rooms are what guests book. Add at least one to start inviting guests
          and taking visits.
        </p>
        <RoomEditDialog
          propertyId={propertyId}
          displayOrder={0}
          fields={['name', 'max_occupancy', 'beds', 'description', 'amenities']}
          title="Add a room"
          trigger={
            <Button className="mt-4 w-full" size="lg">
              <Plus className="mr-1 h-4 w-4" />
              Add room
            </Button>
          }
        />
      </div>
    </div>
  );
}
