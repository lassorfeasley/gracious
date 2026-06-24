import {
  VISIT_CHECK_IN_HOUR,
  VISIT_CHECK_OUT_HOUR,
  type VisitEvent,
} from '@/lib/ical';

/**
 * Pre-filled "add event" URLs for the major web calendars. These are plain
 * links, so they work anywhere — emails, buttons — without authentication.
 * Apple Calendar (and desktop Outlook) are covered by the .ics file instead.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** "2026-07-12" + hour → "20260712T150000" (floating local time). */
function compactStamp(date: string, hour: number): string {
  return `${date.replaceAll('-', '')}T${pad(hour)}0000`;
}

/** "2026-07-12" + hour → "2026-07-12T15:00:00" (floating local time). */
function isoStamp(date: string, hour: number): string {
  return `${date}T${pad(hour)}:00:00`;
}

export function googleCalendarUrl(event: VisitEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${compactStamp(event.checkIn, VISIT_CHECK_IN_HOUR)}/${compactStamp(event.checkOut, VISIT_CHECK_OUT_HOUR)}`,
    details: event.description,
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(event: VisitEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    body: event.description,
    location: event.location,
    startdt: isoStamp(event.checkIn, VISIT_CHECK_IN_HOUR),
    enddt: isoStamp(event.checkOut, VISIT_CHECK_OUT_HOUR),
  });
  return `https://outlook.live.com/calendar/0/action/compose?${params.toString()}`;
}
