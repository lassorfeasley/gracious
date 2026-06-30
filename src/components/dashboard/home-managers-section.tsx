'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export interface HomeManager {
  id: string;
  user: { email: string; name: string | null };
}

/**
 * Owner-only management of a home's co-managers. Lives on the home's overview
 * page (it's home-specific), backed by the `property_managers` table.
 */
export function HomeManagersSection({
  propertyId,
  propertyName,
  managers,
}: {
  propertyId: string;
  propertyName: string;
  managers: HomeManager[];
}) {
  const router = useRouter();
  const [managerEmail, setManagerEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function addManager() {
    if (!managerEmail) return;
    setLoading(true);
    const supabase = createClient();

    const { data: managerUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', managerEmail.toLowerCase())
      .single();

    if (!managerUser) {
      toast.error('User not found. They need an account first.');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('property_managers').insert({
      property_id: propertyId,
      user_id: managerUser.id,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Co-manager added');
    setManagerEmail('');
    router.refresh();
  }

  async function removeManager(id: string) {
    const supabase = createClient();
    await supabase.from('property_managers').delete().eq('id', id);
    toast.success('Co-manager removed');
    router.refresh();
  }

  return (
    <section id="managers" className="scroll-mt-28 py-10">
      <h2 className="text-2xl font-semibold tracking-tight">Home managers</h2>
      <p className="mt-2 text-base text-muted-foreground">
        Home managers can run <strong>{propertyName}</strong> with you —
        calendar, guests, and requests — but cannot add other managers or delete
        the home.
      </p>
      <div className="mt-6 max-w-xl space-y-4">
        <div className="flex gap-2">
          <Input
            type="email"
            placeholder="manager@email.com"
            value={managerEmail}
            onChange={(e) => setManagerEmail(e.target.value)}
          />
          <Button onClick={addManager} disabled={loading}>
            Add
          </Button>
        </div>
        {managers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No home managers yet.</p>
        ) : (
          <ul className="space-y-2">
            {managers.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded border px-3 py-2 text-sm"
              >
                <span>{m.user.name ?? m.user.email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => removeManager(m.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
