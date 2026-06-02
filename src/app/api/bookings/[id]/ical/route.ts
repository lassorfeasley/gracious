import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getBookingWithDetails } from '@/lib/bookings';
import { generateIcs } from '@/lib/ical';
import { canManageProperty } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
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

  const ics = generateIcs(booking);
  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="stay-${booking.property.slug}.ics"`,
    },
  });
}
