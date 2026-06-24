import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseCalendarFeedToken } from '@/lib/calendar-feed';
import { getApprovedVisitsForFeed } from '@/lib/visits';
import { generatePropertyFeedIcs } from '@/lib/ical';

/**
 * Subscribable calendar feed for a property's confirmed visits. Unauthenticated
 * by design — calendar apps poll this without cookies — so the signed token in
 * the path is the credential. Returns an always-200 VCALENDAR so a subscription
 * never breaks; an invalid token simply yields an empty calendar.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  // The URL carries a ".ics" suffix for client friendliness; strip it.
  const cleanToken = token.replace(/\.ics$/i, '');
  const parsed = parseCalendarFeedToken(cleanToken);

  const admin = createAdminClient();
  let property: { name: string; address: string | null } | null = null;
  let visits: Awaited<ReturnType<typeof getApprovedVisitsForFeed>> = [];

  if (parsed) {
    const { data } = await admin
      .from('properties')
      .select('name, address')
      .eq('id', parsed.propertyId)
      .single();
    if (data) {
      property = data;
      visits = await getApprovedVisitsForFeed(parsed.propertyId);
    }
  }

  const ics = generatePropertyFeedIcs(
    property ?? { name: 'Gracious', address: null },
    visits
  );

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="gracious-visits.ics"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
