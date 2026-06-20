import { createEvent } from 'ics';
import type { VisitWithDetails } from '@/types/database';
import { formatDateRange } from '@/lib/dates';

/** Default event times used when a property has no explicit schedule. */
export const STAY_CHECK_IN_HOUR = 15;
export const STAY_CHECK_OUT_HOUR = 11;

/**
 * Calendar-agnostic description of a stay event. Single source of truth for
 * the .ics file and the Google/Outlook quick-add links so every calendar
 * shows the same thing.
 */
export interface StayEvent {
  title: string;
  description: string;
  location: string;
  /** yyyy-MM-dd */
  checkIn: string;
  /** yyyy-MM-dd */
  checkOut: string;
}

export function buildStayEvent(visit: VisitWithDetails): StayEvent {
  const roomNames = visit.rooms.map((r) => r.name).join(', ');

  return {
    title: `Stay at ${visit.property.name}`,
    description: [
      `Property: ${visit.property.name}`,
      visit.property.address ? `Address: ${visit.property.address}` : '',
      `Rooms: ${roomNames}`,
      `Dates: ${formatDateRange(visit.dates.check_in, visit.dates.check_out)}`,
      visit.property.wifi_name
        ? `WiFi: ${visit.property.wifi_name}${visit.property.wifi_password ? ` / ${visit.property.wifi_password}` : ''}`
        : '',
      visit.property.check_in_instructions
        ? `Check-in: ${visit.property.check_in_instructions}`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
    location: visit.property.address ?? visit.property.name,
    checkIn: visit.dates.check_in,
    checkOut: visit.dates.check_out,
  };
}

export function generateIcs(visit: VisitWithDetails): string {
  const event = buildStayEvent(visit);
  const checkIn = new Date(`${event.checkIn}T15:00:00`);
  const checkOut = new Date(`${event.checkOut}T11:00:00`);

  const { error, value } = createEvent({
    start: [
      checkIn.getFullYear(),
      checkIn.getMonth() + 1,
      checkIn.getDate(),
      STAY_CHECK_IN_HOUR,
      0,
    ],
    end: [
      checkOut.getFullYear(),
      checkOut.getMonth() + 1,
      checkOut.getDate(),
      STAY_CHECK_OUT_HOUR,
      0,
    ],
    title: event.title,
    description: event.description,
    location: event.location,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    organizer: {
      name: 'Gracious',
      email: 'hello@gracious.host',
    },
  });

  if (error || !value) {
    throw new Error('Failed to generate calendar file');
  }

  return value;
}
