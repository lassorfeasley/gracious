import { createAdminClient } from '@/lib/supabase/admin';
import { requireSiteAdmin } from '@/lib/auth';
import { UserAdminToggle } from '@/components/admin/user-admin-toggle';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/dates';
import type { User } from '@/types/database';

export const metadata = { title: 'Users · Admin' };

export default async function AdminUsersPage() {
  const actor = await requireSiteAdmin();
  const admin = createAdminClient();

  const [{ data: users }, { data: owners }, { data: managers }] =
    await Promise.all([
      admin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false }),
      admin.from('properties').select('owner_id'),
      admin.from('property_managers').select('user_id'),
    ]);

  // Host is derived: anyone who owns or co-manages at least one property.
  const hostIds = new Set<string>([
    ...(owners ?? []).map((p) => p.owner_id),
    ...(managers ?? []).map((m) => m.user_id),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="mt-1 text-muted-foreground">
          {users?.length ?? 0} accounts on the platform
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Capabilities</th>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(users as User[] | null)?.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-4 py-3">{u.name ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1.5">
                    {hostIds.has(u.id) ? (
                      <Badge variant="secondary">Host</Badge>
                    ) : null}
                    <Badge variant="outline">Guest</Badge>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <UserAdminToggle
                    userId={u.id}
                    isAdmin={u.is_admin}
                    disabled={u.id === actor.id}
                  />
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(u.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users?.length && (
          <p className="p-8 text-center text-muted-foreground">No users yet.</p>
        )}
      </div>
    </div>
  );
}
