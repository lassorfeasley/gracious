'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export function CancelVisitButton({ visitId }: { visitId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function cancel() {
    setLoading(true);
    const res = await fetch(`/api/visits/${visitId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error('Failed to cancel visit');
      return;
    }
    toast.success('Visit cancelled');
    router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive">
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel this visit?</AlertDialogTitle>
          <AlertDialogDescription>
            The host will be notified. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep visit</AlertDialogCancel>
          <AlertDialogAction onClick={cancel} disabled={loading}>
            {loading ? 'Cancelling...' : 'Cancel visit'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
