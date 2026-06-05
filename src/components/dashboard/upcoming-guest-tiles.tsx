import Link from 'next/link';
import { Calendar, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateRange } from '@/lib/dates';
import type { GuestRosterEntry } from '@/lib/guest-roster';

export function UpcomingGuestTiles({
  guests,
  slug,
}: {
  guests: GuestRosterEntry[];
  slug: string;
}) {
  const upcoming = guests.filter((g) => g.upcomingStay);

  if (upcoming.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No upcoming stays on the calendar. Invite a guest or add a manual
          stay to get started.
        </CardContent>
      </Card>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {upcoming.map((guest) => {
        const stay = guest.upcomingStay!;
        const onProperty =
          stay.checkIn <= today && stay.checkOut >= today;
        return (
          <Link
            key={guest.key}
            href={`/dashboard/${slug}/guests/${guest.key}`}
            className="group block"
          >
            <Card className="h-full transition-colors hover:border-foreground/20 hover:bg-muted/30">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold group-hover:underline">
                      {guest.name}
                    </p>
                    {guest.email && (
                      <p className="truncate text-sm text-muted-foreground">
                        {guest.email}
                      </p>
                    )}
                  </div>
                  {stay.isManual ? (
                    <Badge variant="secondary" className="shrink-0">
                      Manual
                    </Badge>
                  ) : onProperty ? (
                    <Badge className="shrink-0">On property</Badge>
                  ) : (
                    <Badge variant="outline" className="shrink-0">
                      Upcoming
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  {formatDateRange(stay.checkIn, stay.checkOut)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4 shrink-0" />
                  {stay.partySize} guest{stay.partySize !== 1 ? 's' : ''}
                  {stay.roomNames.length > 0 && (
                    <span className="truncate">
                      · {stay.roomNames.join(', ')}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
