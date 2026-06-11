import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getBookingWithDetails } from '@/lib/bookings';
import { buildStayEvent, generateIcs } from '@/lib/ical';
import { googleCalendarUrl, outlookCalendarUrl } from '@/lib/calendar-links';
import { canManageProperty } from '@/lib/auth';

/**
 * Add-to-calendar endpoint for a booking.
 * - default: downloads an .ics file (Apple Calendar, desktop Outlook, etc.)
 * - ?provider=google|outlook: redirects to that calendar's pre-filled add-event page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const booking = await getBookingWithDetails(id);
  if (!booking || booking.status !== 'approved') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const isGuest = booking.guest_user_id === user.id;
  const isOwner = await canManageProperty(booking.property_id, user.id);
  if (!isGuest && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const provider = request.nextUrl.searchParams.get('provider');
  if (provider === 'google') {
    return NextResponse.redirect(googleCalendarUrl(buildStayEvent(booking)));
  }
  if (provider === 'outlook') {
    return NextResponse.redirect(outlookCalendarUrl(buildStayEvent(booking)));
  }

  const ics = generateIcs(booking);
  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="stay-${booking.property.slug}.ics"`,
    },
  });
}
