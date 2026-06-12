import { createAdminClient } from '@/lib/supabase/admin';
import { formatDate } from '@/lib/dates';
import { Badge } from '@/components/ui/badge';

export const metadata = { title: 'Properties · Admin' };

export default async function AdminPropertiesPage() {
  const admin = createAdminClient();

  const { data: properties } = await admin
    .from('properties')
    .select('*, owner:users!owner_id(email, name)')
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Properties</h1>
        <p className="mt-1 text-muted-foreground">
          {properties?.length ?? 0} listings on the platform
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Property</th>
              <th className="px-4 py-3 font-medium">Host</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Created</th>
            </tr>
          </thead>
          <tbody>
            {properties?.map((p) => {
              const owner = Array.isArray(p.owner) ? p.owner[0] : p.owner;
              return (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {owner?.name ?? owner?.email ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{p.slug}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(p.created_at)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!properties?.length && (
          <p className="p-8 text-center text-muted-foreground">
            No properties yet.
          </p>
        )}
      </div>
    </div>
  );
}
