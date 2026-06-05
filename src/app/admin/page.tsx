import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function AdminOverviewPage() {
  const admin = createAdminClient();

  const [
    { count: userCount },
    { count: ownerCount },
    { count: guestCount },
    { count: propertyCount },
    { count: bookingCount },
    { count: pendingRequests },
    { count: invitationCount },
  ] = await Promise.all([
    admin.from('users').select('*', { count: 'exact', head: true }),
    admin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'owner'),
    admin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'guest'),
    admin.from('properties').select('*', { count: 'exact', head: true }),
    admin.from('bookings').select('*', { count: 'exact', head: true }),
    admin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'requested'),
    admin.from('invitations').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    { label: 'Users', value: userCount ?? 0, href: '/admin/users' },
    { label: 'Property hosts', value: ownerCount ?? 0, href: '/admin/users' },
    { label: 'Guests', value: guestCount ?? 0, href: '/admin/users' },
    { label: 'Properties', value: propertyCount ?? 0, href: '/admin/properties' },
    { label: 'Bookings', value: bookingCount ?? 0, href: '/admin/bookings' },
    {
      label: 'Pending requests',
      value: pendingRequests ?? 0,
      href: '/admin/bookings',
    },
    { label: 'Invitations', value: invitationCount ?? 0, href: '/admin/bookings' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform overview</h1>
        <p className="mt-1 text-muted-foreground">
          Site-wide metrics across all hosts and guests.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex items-end justify-between">
              <p className="text-3xl font-semibold tabular-nums">{s.value}</p>
              <Button variant="ghost" size="sm" asChild>
                <Link href={s.href}>View</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Access</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Grant site admin by setting a user&apos;s role to{' '}
            <strong className="text-foreground">admin</strong> under Users, or add
            their email to{' '}
            <code className="rounded bg-muted px-1">SITE_ADMIN_EMAILS</code> in your
            environment (comma-separated) for bootstrap access before the role is
            assigned in the database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
