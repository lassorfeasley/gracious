'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { VisitWithDetails } from '@/types/database';

export function VisitMainActions({ visit }: { visit: VisitWithDetails }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const canEdit =
    visit.status === 'requested' || visit.status === 'approved';

  if (visit.status !== 'approved' && !canEdit) return null;

  async function handleCancel() {
    if (!confirm('Cancel this visit? This frees up the dates.')) return;
    setLoading(true);
    const res = await fetch(`/api/visits/${visit.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error('Could not cancel the visit');
      return;
    }
    toast.success('Visit cancelled');
    router.refresh();
  }

  return (
    <section className="py-10">
      <h2 className="text-2xl font-semibold tracking-tight">Manage this visit</h2>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {visit.status === 'approved' && (
          <Button variant="outline" asChild>
            <a href={`/api/visits/${visit.id}/ical`} download>
              <Calendar className="mr-2 h-4 w-4" />
              Add to calendar
            </a>
          </Button>
        )}
        {canEdit && (
          <Button
            variant="outline"
            className="text-destructive hover:text-destructive"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel visit
          </Button>
        )}
      </div>
    </section>
  );
}
