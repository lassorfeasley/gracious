import { createAdminClient } from '@/lib/supabase/admin';
import { formatDateRange, formatDate } from '@/lib/dates';
import { Badge } from '@/components/ui/badge';

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  requested: 'secondary',
  approved: 'default',
  declined: 'destructive',
  cancelled: 'outline',
};

export const metadata = { title: 'Bookings · Admin' };

export default async function AdminBookingsPage() {
  const admin = createAdminClient();

  const { data: bookings } = await admin
    .from('bookings')
    .select(
      `
      id,
      status,
      party_size,
      created_at,
      property:properties(name, slug),
      guest:users!guest_user_id(email, name),
      dates:booking_dates(check_in, check_out),
      booking_rooms(room:rooms(name))
    `
    )
    .order('created_at', { ascending: false })
    .limit(100);

  const { data: invitations } = await admin
    .from('invitations')
    .select('id, guest_email, status, type, created_at, property:properties(name)')
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bookings</h1>
          <p className="mt-1 text-muted-foreground">
            Latest {bookings?.length ?? 0} bookings (most recent first)
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Guest</th>
                <th className="px-4 py-3 font-medium">Dates</th>
                <th className="px-4 py-3 font-medium">Rooms</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {bookings?.map((b) => {
                const property = Array.isArray(b.property)
                  ? b.property[0]
                  : b.property;
                const guest = Array.isArray(b.guest) ? b.guest[0] : b.guest;
                const dates = Array.isArray(b.dates) ? b.dates[0] : b.dates;
                const rooms =
                  b.booking_rooms?.map(
                    (br: { room: { name: string } | { name: string }[] }) => {
                      const room = Array.isArray(br.room) ? br.room[0] : br.room;
                      return room?.name;
                    }
                  ) ?? [];

                return (
                  <tr key={b.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {property?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {guest?.name ?? guest?.email ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      {dates
                        ? formatDateRange(dates.check_in, dates.check_out)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {rooms.join(', ') || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[b.status] ?? 'outline'}>
                        {b.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(b.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!bookings?.length && (
            <p className="p-8 text-center text-muted-foreground">
              No bookings yet.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Recent invitations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest {invitations?.length ?? 0} invitations
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">Property</th>
                <th className="px-4 py-3 font-medium">Guest email</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Sent</th>
              </tr>
            </thead>
            <tbody>
              {invitations?.map((inv) => {
                const property = Array.isArray(inv.property)
                  ? inv.property[0]
                  : inv.property;
                return (
                  <tr key={inv.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {property?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {inv.guest_email}
                    </td>
                    <td className="px-4 py-3">{inv.type.replace('_', ' ')}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{inv.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(inv.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!invitations?.length && (
            <p className="p-8 text-center text-muted-foreground">
              No invitations yet.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
