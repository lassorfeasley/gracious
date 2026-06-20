'use client';

import { useState } from 'react';
import type { Room } from '@/types/database';
import type { RoomAvailability } from '@/lib/guest-calendar';
import { VisitProvider } from '@/components/guest/visit-context';
import { HostPageSidebar } from '@/components/dashboard/host-page-sidebar';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface PortfolioSidebarHouse {
  id: string;
  name: string;
  rooms: Room[];
  roomAvailability: Record<string, RoomAvailability>;
}

export function PortfolioVisitSidebar({
  houses,
}: {
  houses: PortfolioSidebarHouse[];
}) {
  const [selectedId, setSelectedId] = useState(houses[0]?.id ?? '');
  const house = houses.find((h) => h.id === selectedId) ?? houses[0];

  if (!house) return null;

  const homeSelect = (
    <div className="space-y-2">
      <Label htmlFor="portfolio-home-select">Visit for</Label>
      <Select value={house.id} onValueChange={setSelectedId}>
        <SelectTrigger id="portfolio-home-select" className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {houses.map((h) => (
            <SelectItem key={h.id} value={h.id}>
              {h.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    // Remount per home so dates/rooms/guests reset cleanly on switch.
    <VisitProvider
      key={house.id}
      rooms={house.rooms}
      roomAvailability={house.roomAvailability}
      defaultGuests={1}
    >
      <HostPageSidebar
        propertyId={house.id}
        rooms={house.rooms}
        roomAvailability={house.roomAvailability}
        headerSlot={homeSelect}
      />
    </VisitProvider>
  );
}
