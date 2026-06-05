'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { UserRole } from '@/types/database';

const ROLES: UserRole[] = ['guest', 'owner', 'admin'];

export function UserRoleSelect({
  userId,
  currentRole,
  disabled,
}: {
  userId: string;
  currentRole: UserRole;
  disabled?: boolean;
}) {
  const router = useRouter();

  async function onChange(role: UserRole) {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(
        typeof data.error === 'string' ? data.error : 'Failed to update role'
      );
      return;
    }
    toast.success('Role updated');
    router.refresh();
  }

  return (
    <Select
      value={currentRole}
      onValueChange={(v) => onChange(v as UserRole)}
      disabled={disabled}
    >
      <SelectTrigger className="w-[120px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {ROLES.map((r) => (
          <SelectItem key={r} value={r}>
            {r}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
