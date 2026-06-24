'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function CancelHostVisitButton({ visitId }: { visitId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCancel() {
    if (
      !window.confirm(
        'Remove this visit from the calendar? This cannot be undone.'
      )
    ) {
      return;
    }

    setLoading(true);
    const res = await fetch(`/api/visits/${visitId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error('Could not remove visit');
      return;
    }

    toast.success('Visit removed');
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      onClick={handleCancel}
      disabled={loading}
    >
      {loading ? 'Removing…' : 'Remove visit'}
    </Button>
  );
}
