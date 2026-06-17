'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function UserInvitationGrant({
  userId,
  bonusInvitations,
  used,
  limit,
}: {
  userId: string;
  bonusInvitations: number;
  used: number;
  limit: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(bonusInvitations);
  const [pending, setPending] = useState(false);

  async function save(next: number) {
    setPending(true);
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bonus_invitations: next }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      toast.error(
        typeof data.error === 'string'
          ? data.error
          : 'Failed to update invitation grant'
      );
      return;
    }
    setValue(next);
    toast.success('Updated bonus invitations');
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <p className="tabular-nums text-muted-foreground">
        {used} / {limit} used
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Bonus</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          aria-label="Decrease bonus invitations"
          disabled={pending || value <= 0}
          onClick={() => save(value - 1)}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-6 text-center text-sm tabular-nums">{value}</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-7 w-7"
          aria-label="Increase bonus invitations"
          disabled={pending}
          onClick={() => save(value + 1)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
