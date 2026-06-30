'use client';

import { useState } from 'react';
import { UserPlus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InviteGuestDialog } from '@/components/dashboard/invite-guest-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { RoomAvailability } from '@/lib/guest-calendar';
import type { Room } from '@/types/database';

export interface InviteHouse {
  id: string;
  name: string;
  rooms: Room[];
  roomAvailability: Record<string, RoomAvailability>;
}

/**
 * House-agnostic "Invite a guest" entry point for the dashboard home base.
 * A single-home host gets the invite dialog directly; a multi-home host first
 * picks which home — inviting is inherently per-house because rooms belong to a
 * house — and then drops into the same dialog.
 */
export function DashboardInviteAction({ houses }: { houses: InviteHouse[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  if (houses.length === 0) return null;

  if (houses.length === 1) {
    const house = houses[0];
    return (
      <InviteGuestDialog
        propertyId={house.id}
        rooms={house.rooms}
        roomAvailability={house.roomAvailability}
        trigger={
          <Button disabled={house.rooms.length === 0}>
            <UserPlus className="mr-1 h-4 w-4" />
            Invite a guest
          </Button>
        }
      />
    );
  }

  const selected = houses.find((h) => h.id === selectedId) ?? null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <UserPlus className="mr-1 h-4 w-4" />
            Invite a guest
            <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {houses.map((house) => (
            <DropdownMenuItem
              key={house.id}
              disabled={house.rooms.length === 0}
              onSelect={() => {
                setSelectedId(house.id);
                // Defer so the menu finishes closing before the dialog opens,
                // avoiding a focus tug-of-war between the two Radix layers.
                setTimeout(() => setOpen(true), 0);
              }}
            >
              {house.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {selected && (
        <InviteGuestDialog
          key={selected.id}
          propertyId={selected.id}
          rooms={selected.rooms}
          roomAvailability={selected.roomAvailability}
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setSelectedId(null);
          }}
        />
      )}
    </>
  );
}
