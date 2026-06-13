'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

export function UserAdminToggle({
  userId,
  isAdmin,
  disabled,
}: {
  userId: string;
  isAdmin: boolean;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onChange(next: boolean) {
    setPending(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_admin: next }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      toast.error(
        typeof data.error === 'string' ? data.error : 'Failed to update access'
      );
      return;
    }
    toast.success(next ? 'Granted admin access' : 'Removed admin access');
    router.refresh();
  }

  return (
    <Switch
      checked={isAdmin}
      onCheckedChange={onChange}
      disabled={disabled || pending}
      aria-label="Platform admin"
    />
  );
}
