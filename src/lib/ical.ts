import { createEvent } from 'ics';
import type { BookingWithDetails } from '@/types/database';
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

export function buildStayEvent(booking: BookingWithDetails): StayEvent {
  const roomNames = booking.rooms.map((r) => r.name).join(', ');

  return {
    title: `Stay at ${booking.property.name}`,
    description: [
      `Property: ${booking.property.name}`,
      booking.property.address ? `Address: ${booking.property.address}` : '',
      `Rooms: ${roomNames}`,
      `Dates: ${formatDateRange(booking.dates.check_in, booking.dates.check_out)}`,
      booking.property.wifi_name
        ? `WiFi: ${booking.property.wifi_name}${booking.property.wifi_password ? ` / ${booking.property.wifi_password}` : ''}`
        : '',
      booking.property.check_in_instructions
        ? `Check-in: ${booking.property.check_in_instructions}`
        : '',
    ]
      .filter(Boolean)
      .join('\n'),
    location: booking.property.address ?? booking.property.name,
    checkIn: booking.dates.check_in,
    checkOut: booking.dates.check_out,
  };
}

export function generateIcs(booking: BookingWithDetails): string {
  const event = buildStayEvent(booking);
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
