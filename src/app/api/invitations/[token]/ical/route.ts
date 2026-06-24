import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, canManageProperty } from '@/lib/auth';
import { getInvitationByToken } from '@/lib/invitations';
import {
  buildInvitationVisitEvent,
  generateInvitationIcs,
} from '@/lib/ical';
import { googleCalendarUrl, outlookCalendarUrl } from '@/lib/calendar-links';

/**
 * Add-to-calendar endpoint for a freshly-created invitation, used by the host's
 * "invitation sent" dialog. Host-only: this is the host's own tentative event,
 * not something a guest should pull. Standing invites (no dates) 404.
 * - default: downloads an .ics file (one event per offered window)
 * - ?provider=google|outlook: redirects to the first window's add-event page
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const isHost = await canManageProperty(invitation.property_id, user.id);
  if (!isHost) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (invitation.windows.length === 0) {
    return NextResponse.json(
      { error: 'This invitation has no dates to add to a calendar' },
      { status: 400 }
    );
  }

  const provider = request.nextUrl.searchParams.get('provider');
  if (provider === 'google' || provider === 'outlook') {
    const event = buildInvitationVisitEvent(invitation);
    if (!event) {
      return NextResponse.json({ error: 'No dates' }, { status: 400 });
    }
    return NextResponse.redirect(
      provider === 'google'
        ? googleCalendarUrl(event)
        : outlookCalendarUrl(event)
    );
  }

  const ics = generateInvitationIcs(invitation);
  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="invitation-${invitation.property.slug}.ics"`,
    },
  });
}
