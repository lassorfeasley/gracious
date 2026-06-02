import { createClient } from '@/lib/supabase/server';
import { formatDateRange } from '@/lib/dates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

async function getProperty(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('properties').select('*').eq('slug', slug).single();
  return data;
}

export default async function OverviewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return null;

  const supabase = await createClient();
  const today = new Date().toISOString().split('T')[0];

  const { data: upcoming } = await supabase
    .from('bookings')
    .select(
      `*, guest:users!guest_user_id(name, email), dates:booking_dates(check_in, check_out), booking_rooms(room:rooms(name))`
    )
    .eq('property_id', property.id)
    .eq('status', 'approved')
    .order('created_at');

  const { count: pendingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', property.id)
    .eq('status', 'requested');

  const { count: roomCount } = await supabase
    .from('rooms')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', property.id);

  const { count: inviteCount } = await supabase
    .from('invitations')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', property.id)
    .in('status', ['pending', 'accepted']);

  const approvedUpcoming =
    upcoming?.filter((b) => {
      const dates = Array.isArray(b.dates) ? b.dates[0] : b.dates;
      return dates && dates.check_out >= today;
    }) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="text-muted-foreground">{property.name}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{pendingCount ?? 0}</p>
            {(pendingCount ?? 0) > 0 && (
              <Link
                href={`/dashboard/${slug}/requests`}
                className="text-sm text-primary underline"
              >
                Review requests
              </Link>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rooms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{roomCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active invitations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{inviteCount ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Upcoming stays</h2>
        <div className="mt-4 space-y-3">
          {approvedUpcoming.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No upcoming approved stays.
              </CardContent>
            </Card>
          ) : (
            approvedUpcoming.map((booking) => {
              const dates = Array.isArray(booking.dates)
                ? booking.dates[0]
                : booking.dates;
              const guest = booking.guest as { name: string | null; email: string };
              return (
                <Card key={booking.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">
                        {guest.name ?? guest.email}
                      </p>
                      {dates && (
                        <p className="text-sm text-muted-foreground">
                          {formatDateRange(dates.check_in, dates.check_out)}
                        </p>
                      )}
                    </div>
                    <Badge>Confirmed</Badge>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
