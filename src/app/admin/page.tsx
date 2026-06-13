import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AUTOMATED_MESSAGES } from '@/lib/messaging/registry';

export const metadata = { title: 'Admin' };

export default async function AdminOverviewPage() {
  const admin = createAdminClient();

  const [
    { count: userCount },
    { count: adminCount },
    { data: owners },
    { data: managers },
    { count: propertyCount },
    { count: bookingCount },
    { count: pendingRequests },
    { count: invitationCount },
  ] = await Promise.all([
    admin.from('users').select('*', { count: 'exact', head: true }),
    admin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_admin', true),
    admin.from('properties').select('owner_id'),
    admin.from('property_managers').select('user_id'),
    admin.from('properties').select('*', { count: 'exact', head: true }),
    admin.from('bookings').select('*', { count: 'exact', head: true }),
    admin
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'requested'),
    admin.from('invitations').select('*', { count: 'exact', head: true }),
  ]);

  // Hosts are derived: distinct users who own or co-manage a property.
  const hostCount = new Set<string>([
    ...(owners ?? []).map((p) => p.owner_id),
    ...(managers ?? []).map((m) => m.user_id),
  ]).size;

  const stats = [
    { label: 'Users', value: userCount ?? 0, href: '/admin/users' },
    { label: 'Hosts', value: hostCount, href: '/admin/users' },
    { label: 'Admins', value: adminCount ?? 0, href: '/admin/users' },
    { label: 'Properties', value: propertyCount ?? 0, href: '/admin/properties' },
    { label: 'Bookings', value: bookingCount ?? 0, href: '/admin/bookings' },
    {
      label: 'Pending requests',
      value: pendingRequests ?? 0,
      href: '/admin/bookings',
    },
    { label: 'Invitations', value: invitationCount ?? 0, href: '/admin/bookings' },
    {
      label: 'Automated messages',
      value: AUTOMATED_MESSAGES.length,
      href: '/admin/messaging',
    },
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
            Grant site admin with the{' '}
            <strong className="text-foreground">Admin</strong> toggle under Users,
            or add their email to{' '}
            <code className="rounded bg-muted px-1">SITE_ADMIN_EMAILS</code> in your
            environment (comma-separated) for bootstrap access before the flag is
            set in the database.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
