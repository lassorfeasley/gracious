import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getVisitWithDetails } from '@/lib/visits';
import { buildVisitEvent, generateIcs } from '@/lib/ical';
import { googleCalendarUrl, outlookCalendarUrl } from '@/lib/calendar-links';
import { canManageProperty } from '@/lib/auth';

/**
 * Add-to-calendar endpoint for a visit.
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

  const visit = await getVisitWithDetails(id);
  if (!visit || visit.status !== 'approved') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const isGuest = visit.guest_user_id === user.id;
  const isOwner = await canManageProperty(visit.property_id, user.id);
  if (!isGuest && !isOwner) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const provider = request.nextUrl.searchParams.get('provider');
  if (provider === 'google') {
    return NextResponse.redirect(googleCalendarUrl(buildVisitEvent(visit)));
  }
  if (provider === 'outlook') {
    return NextResponse.redirect(outlookCalendarUrl(buildVisitEvent(visit)));
  }

  const ics = generateIcs(visit);
  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="visit-${visit.property.slug}.ics"`,
    },
  });
}
