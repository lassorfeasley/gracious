'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { BookingWithDetails } from '@/types/database';

export function BookingMainActions({ booking }: { booking: BookingWithDetails }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const canEdit =
    booking.status === 'requested' || booking.status === 'approved';

  if (booking.status !== 'approved' && !canEdit) return null;

  async function handleCancel() {
    if (!confirm('Cancel this stay? This frees up the dates.')) return;
    setLoading(true);
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error('Could not cancel the stay');
      return;
    }
    toast.success('Stay cancelled');
    router.refresh();
  }

  return (
    <section className="py-10">
      <h2 className="text-2xl font-semibold tracking-tight">Manage this stay</h2>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        {booking.status === 'approved' && (
          <Button variant="outline" asChild>
            <a href={`/api/bookings/${booking.id}/ical`} download>
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
            Cancel stay
          </Button>
        )}
      </div>
    </section>
  );
}
