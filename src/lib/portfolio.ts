import { createAdminClient } from '@/lib/supabase/admin';
import { getInvitationRoomAvailability } from '@/lib/guest-availability';
import type { Property, Room } from '@/types/database';
import type { RoomAvailability } from '@/lib/guest-calendar';
import type { TimelineRow, TimelineStay } from '@/components/visit-timeline';

export interface PortfolioCalendarVisit {
  id: string;
  propertyId: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  pending?: boolean;
}

export interface PortfolioCalendarBlock {
  id: string;
  propertyId: string;
  start_date: string;
  end_date: string;
}

export interface PortfolioHouse {
  property: Property;
  rooms: Room[];
  roomAvailability: Record<string, RoomAvailability>;
  roomCount: number;
  upcomingCount: number;
  nextVisit: { guestName: string; checkIn: string; checkOut: string } | null;
}

export interface PortfolioData {
  houses: PortfolioHouse[];
  timelineRows: TimelineRow[];
  calendarVisits: PortfolioCalendarVisit[];
  calendarBlocks: PortfolioCalendarBlock[];
}

/**
 * Aggregates a host's whole portfolio for the multi-home overview: per-house
 * stats + rooms/availability (for the visit sidebar), a home-grouped timeline
 * with a row per room, and a combined occupancy calendar across every home.
 */
export async function getPortfolioData(
  properties: Property[]
): Promise<PortfolioData> {
  const today = new Date().toISOString().split('T')[0];

  const admin = createAdminClient();
  const propertyIds = properties.map((p) => p.id);

  const { data: roomRows } = await admin
    .from('rooms')
    .select('*')
    .in('property_id', propertyIds)
    .order('display_order');

  const rooms = (roomRows ?? []) as Room[];
  const roomIds = rooms.map((r) => r.id);
  const availability = await getInvitationRoomAvailability(roomIds, {
    includeGuestNames: true,
  });

  const roomsByProperty = new Map<string, Room[]>();
  for (const room of rooms) {
    const list = roomsByProperty.get(room.property_id) ?? [];
    list.push(room);
    roomsByProperty.set(room.property_id, list);
  }

  const houses: PortfolioHouse[] = [];
  const timelineRows: TimelineRow[] = [];
  const calendarVisits: PortfolioCalendarVisit[] = [];
  const calendarBlocks: PortfolioCalendarBlock[] = [];

  for (const property of properties) {
    const propertyRooms = roomsByProperty.get(property.id) ?? [];

    const houseAvailability: Record<string, RoomAvailability> = {};
    for (const room of propertyRooms) {
      houseAvailability[room.id] = availability[room.id] ?? {
        visits: [],
        blocks: [],
      };
    }

    // A visit can span several rooms in the same home; collapse to one band
    // for the calendar + stats.
    const visitsById = new Map<string, PortfolioCalendarVisit>();
    for (const room of propertyRooms) {
      const avail = houseAvailability[room.id];
      for (const b of avail.visits) {
        if (!visitsById.has(b.id)) {
          visitsById.set(b.id, {
            id: b.id,
            propertyId: property.id,
            guestName: b.guestName,
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            pending: b.pending,
          });
        }
      }
      for (const bl of avail.blocks) {
        calendarBlocks.push({
          id: bl.id,
          propertyId: property.id,
          start_date: bl.start_date,
          end_date: bl.end_date,
        });
      }
    }

    const houseVisits = Array.from(visitsById.values());

    // Combined calendar: tag the guest with the home for the day tooltip.
    for (const b of houseVisits) {
      calendarVisits.push({
        ...b,
        propertyId: property.id,
        guestName: `${b.guestName} · ${property.name}`,
      });
    }

    // Timeline: grouped by home, one row per room (every room shows, even when
    // empty), with visits and owner blocks as bands.
    if (propertyRooms.length === 0) {
      timelineRows.push({
        id: `${property.id}-empty`,
        label: 'No rooms yet',
        group: property.name,
        stays: [],
      });
    } else {
      for (const room of propertyRooms) {
        const avail = houseAvailability[room.id];
        const stays: TimelineStay[] = [
          ...avail.visits.map((b) => ({
            id: `visit-${room.id}-${b.id}`,
            label: b.guestName,
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            variant: (b.pending ? 'pending' : 'confirmed') as TimelineStay['variant'],
            href: `/dashboard/${property.slug}/visits/${b.id}`,
          })),
          ...avail.blocks.map((bl) => ({
            id: `block-${room.id}-${bl.id}`,
            label: 'Blocked',
            checkIn: bl.start_date,
            checkOut: bl.end_date,
            variant: 'blocked' as TimelineStay['variant'],
          })),
        ];
        timelineRows.push({
          id: room.id,
          label: room.name,
          group: property.name,
          stays,
        });
      }
    }

    const upcoming = houseVisits
      .filter((b) => !b.pending && b.checkOut >= today)
      .sort((a, b) => a.checkIn.localeCompare(b.checkIn));

    houses.push({
      property,
      rooms: propertyRooms,
      roomAvailability: houseAvailability,
      roomCount: propertyRooms.length,
      upcomingCount: upcoming.length,
      nextVisit: upcoming[0]
        ? {
            guestName: upcoming[0].guestName,
            checkIn: upcoming[0].checkIn,
            checkOut: upcoming[0].checkOut,
          }
        : null,
    });
  }

  return { houses, timelineRows, calendarVisits, calendarBlocks };
}
