import { createEvent, createEvents, type EventAttributes } from 'ics';
import type {
  InvitationWithDetails,
  Property,
  VisitWithDetails,
} from '@/types/database';
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

/** "2026-07-12" + hour → ics date tuple in floating local time. */
function dateTuple(date: string, hour: number): [number, number, number, number, number] {
  const [y, m, d] = date.split('-').map(Number);
  return [y, m, d, hour, 0];
}

/**
 * Builds a single calendar event for a host-confirmed stay, used by the
 * property feed. Mirrors `buildStayEvent` but works from the lighter shape the
 * feed query returns (no full property/room joins needed per row).
 */
export interface FeedVisit {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  roomNames: string[];
  partySize: number;
}

function feedEventDescription(visit: FeedVisit): string {
  return [
    `Guest: ${visit.guestName}`,
    visit.roomNames.length > 0 ? `Rooms: ${visit.roomNames.join(', ')}` : '',
    `Dates: ${formatDateRange(visit.checkIn, visit.checkOut)}`,
    visit.partySize > 0 ? `Party size: ${visit.partySize}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * A subscribable VCALENDAR of every confirmed stay at a property. Calendar apps
 * (Apple/Google) poll the feed URL and keep these events in sync on their own
 * schedule. Stable per-visit UIDs let updates and cancellations reconcile
 * instead of duplicating.
 */
export function generatePropertyFeedIcs(
  property: Pick<Property, 'name' | 'address'>,
  visits: FeedVisit[]
): string {
  const calName = `${property.name} — Gracious`;

  // A property with no confirmed stays still needs a valid, non-breaking feed
  // so an existing subscription doesn't error — return an empty VCALENDAR.
  if (visits.length === 0) {
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Gracious//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${calName}`,
      'END:VCALENDAR',
    ].join('\r\n');
  }

  const events: EventAttributes[] = visits.map((visit) => ({
    uid: `visit-${visit.id}@gracious.host`,
    start: dateTuple(visit.checkIn, STAY_CHECK_IN_HOUR),
    end: dateTuple(visit.checkOut, STAY_CHECK_OUT_HOUR),
    title: `${visit.guestName} at ${property.name}`,
    description: feedEventDescription(visit),
    location: property.address ?? property.name,
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    calName,
    organizer: { name: 'Gracious', email: 'hello@gracious.host' },
  }));

  const { error, value } = createEvents(events);
  if (error || !value) {
    throw new Error('Failed to generate calendar feed');
  }
  return value;
}

/** Host-facing label for an invited (not-yet-accepted) guest. */
function invitationGuestLabel(invitation: InvitationWithDetails): string {
  const name = [invitation.guest_first_name, invitation.guest_last_name]
    .filter(Boolean)
    .join(' ');
  return name || invitation.guest_email;
}

/**
 * Calendar event(s) for a freshly-created invitation, added to the *host's*
 * calendar. The guest hasn't accepted yet, so these are marked TENTATIVE and
 * the title makes the pending state explicit. One event per offered window.
 */
export function buildInvitationEvents(
  invitation: InvitationWithDetails
): EventAttributes[] {
  const guest = invitationGuestLabel(invitation);
  const property = invitation.property;
  return invitation.windows.map((w) => ({
    uid: `invitation-${invitation.id}-${w.id}@gracious.host`,
    start: dateTuple(w.start_date, STAY_CHECK_IN_HOUR),
    end: dateTuple(w.end_date, STAY_CHECK_OUT_HOUR),
    title: `${guest} at ${property.name} (invited)`,
    description: [
      `${guest} has been invited to stay at ${property.name}.`,
      'Pending guest acceptance.',
      `Dates: ${formatDateRange(w.start_date, w.end_date)}`,
    ].join('\n'),
    location: property.address ?? property.name,
    status: 'TENTATIVE',
    busyStatus: 'TENTATIVE',
    organizer: { name: 'Gracious', email: 'hello@gracious.host' },
  }));
}

export function generateInvitationIcs(invitation: InvitationWithDetails): string {
  const events = buildInvitationEvents(invitation);
  if (events.length === 0) {
    throw new Error('Invitation has no dates to add to a calendar');
  }
  const { error, value } = createEvents(events);
  if (error || !value) {
    throw new Error('Failed to generate calendar file');
  }
  return value;
}

/** StayEvent for the first window of an invitation — for Google/Outlook quick links. */
export function buildInvitationStayEvent(
  invitation: InvitationWithDetails
): StayEvent | null {
  const w = invitation.windows[0];
  if (!w) return null;
  const guest = invitationGuestLabel(invitation);
  const property = invitation.property;
  return {
    title: `${guest} at ${property.name} (invited)`,
    description: [
      `${guest} has been invited to stay at ${property.name}.`,
      'Pending guest acceptance.',
    ].join('\n'),
    location: property.address ?? property.name,
    checkIn: w.start_date,
    checkOut: w.end_date,
  };
}
