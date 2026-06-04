import Link from 'next/link';
import { requireAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { formatDateRange } from '@/lib/dates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VisibilityToggle } from '@/components/guest/visibility-toggle';
import { CancelBookingButton } from '@/components/guest/cancel-booking-button';
import { AddToCalendarButton } from '@/components/add-to-calendar-button';
import { LogoutButton } from '@/components/logout-button';

const statusColors: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  requested: 'secondary',
  approved: 'default',
  declined: 'destructive',
  cancelled: 'outline',
};

export default async function MyTripsPage() {
  const user = await requireAuth();
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      `
      *,
      property:properties(name, slug),
      dates:booking_dates(check_in, check_out),
      booking_rooms(room:rooms(name)),
      invitation:invitations(token)
    `
    )
    .eq('guest_user_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <span className="font-semibold">GuestHouse</span>
          <div className="flex items-center gap-2">
            <VisibilityToggle visible={user.visible_to_coguests} />
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold">My trips</h1>
        <p className="mt-1 text-muted-foreground">Your stays and requests</p>

        <div className="mt-8 space-y-4">
          {!bookings?.length ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No trips yet.</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Open an invitation link from your host to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            bookings.map((booking) => {
              const dates = Array.isArray(booking.dates)
                ? booking.dates[0]
                : booking.dates;
              const rooms =
                booking.booking_rooms?.map(
                  (br: { room: { name: string } }) => br.room.name
                ) ?? [];

              return (
                <Card key={booking.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">
                        {booking.property?.name}
                      </CardTitle>
                      <Badge variant={statusColors[booking.status] ?? 'outline'}>
                        {booking.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {dates && (
                      <p className="text-sm">
                        {formatDateRange(dates.check_in, dates.check_out)}
                      </p>
                    )}
                    {rooms.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        Rooms: {rooms.join(', ')}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {booking.status === 'approved' && (
                        <AddToCalendarButton bookingId={booking.id} />
                      )}
                      {booking.invitation?.token && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/invite/${booking.invitation.token}`}>
                            View house
                          </Link>
                        </Button>
                      )}
                      {(booking.status === 'requested' ||
                        booking.status === 'approved') && (
                        <CancelBookingButton bookingId={booking.id} />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
