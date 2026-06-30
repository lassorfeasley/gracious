import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseCalendarFeedToken } from '@/lib/calendar-feed';
import { getApprovedVisitsForFeed } from '@/lib/visits';
import {
  generatePropertyFeedIcs,
  generateAccountFeedIcs,
  type AccountFeedVisit,
} from '@/lib/ical';

/**
 * Subscribable calendar feed for confirmed visits. Unauthenticated by design —
 * calendar apps poll this without cookies — so the signed token in the path is
 * the credential. A `property:` token yields one home's visits; an `account:`
 * token yields every home the host owns or co-manages, combined. Always returns
 * a 200 VCALENDAR so a subscription never breaks; an invalid token simply
 * yields an empty calendar.
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

  let ics: string;

  if (parsed?.kind === 'account') {
    ics = await buildAccountFeed(parsed.userId);
  } else if (parsed?.kind === 'property') {
    const { data: property } = await admin
      .from('properties')
      .select('name, address')
      .eq('id', parsed.propertyId)
      .single();
    const visits = property
      ? await getApprovedVisitsForFeed(parsed.propertyId)
      : [];
    ics = generatePropertyFeedIcs(
      property ?? { name: 'Gracious', address: null },
      visits
    );
  } else {
    ics = generateAccountFeedIcs([]);
  }

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="gracious-visits.ics"',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}

async function buildAccountFeed(userId: string): Promise<string> {
  const admin = createAdminClient();

  const [{ data: owned }, { data: managed }] = await Promise.all([
    admin
      .from('properties')
      .select('id, name, address')
      .eq('owner_id', userId),
    admin
      .from('property_managers')
      .select('property:properties(id, name, address)')
      .eq('user_id', userId),
  ]);

  const properties = new Map<
    string,
    { id: string; name: string; address: string | null }
  >();
  for (const p of owned ?? []) {
    properties.set(p.id, p);
  }
  for (const row of managed ?? []) {
    const p = (Array.isArray(row.property) ? row.property[0] : row.property) as
      | { id: string; name: string; address: string | null }
      | null;
    if (p) properties.set(p.id, p);
  }

  const visits: AccountFeedVisit[] = [];
  for (const property of properties.values()) {
    const propertyVisits = await getApprovedVisitsForFeed(property.id);
    for (const visit of propertyVisits) {
      visits.push({
        ...visit,
        propertyName: property.name,
        propertyAddress: property.address,
      });
    }
  }

  return generateAccountFeedIcs(visits);
}
