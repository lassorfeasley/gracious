import { createAdminClient } from '@/lib/supabase/admin';
import { requireSiteAdmin } from '@/lib/auth';
import { UserRoleSelect } from '@/components/admin/user-role-select';
import { formatDate } from '@/lib/dates';
import type { User } from '@/types/database';

export const metadata = { title: 'Users · Admin' };

export default async function AdminUsersPage() {
  const actor = await requireSiteAdmin();
  const admin = createAdminClient();

  const { data: users } = await admin
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

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
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(users as User[] | null)?.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-4 py-3">{u.name ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-3">
                  <UserRoleSelect
                    userId={u.id}
                    currentRole={u.role}
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
