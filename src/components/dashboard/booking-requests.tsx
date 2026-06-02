'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { formatDateRange } from '@/lib/dates';
import { AddToCalendarButton } from '@/components/add-to-calendar-button';

interface RequestBooking {
  id: string;
  status: string;
  party_size: number;
  notes: string | null;
  guest: { name: string | null; email: string };
  dates: { check_in: string; check_out: string } | { check_in: string; check_out: string }[];
  booking_rooms: { room: { name: string } }[];
}

export function BookingRequests({ bookings }: { bookings: RequestBooking[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [declineId, setDeclineId] = useState<string | null>(null);
  const [declineMessage, setDeclineMessage] = useState('');

  async function handleAction(
    bookingId: string,
    action: 'approve' | 'decline',
    message?: string
  ) {
    setLoading(bookingId);
    const res = await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, decline_message: message }),
    });
    setLoading(null);
    setDeclineId(null);

    if (!res.ok) {
      toast.error('Action failed');
      return;
    }

    toast.success(action === 'approve' ? 'Booking approved' : 'Booking declined');
    router.refresh();
  }

  const pending = bookings.filter((b) => b.status === 'requested');
  const recent = bookings.filter((b) => b.status !== 'requested');

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold">Pending requests</h2>
        <div className="mt-4 space-y-3">
          {pending.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending requests — you&apos;re all caught up.
              </CardContent>
            </Card>
          ) : (
            pending.map((booking) => {
              const dates = Array.isArray(booking.dates)
                ? booking.dates[0]
                : booking.dates;
              const rooms =
                booking.booking_rooms?.map((br) => br.room.name).join(', ') ?? '';

              return (
                <Card key={booking.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {booking.guest.name ?? booking.guest.email}
                        </p>
                        {dates && (
                          <p className="text-sm text-muted-foreground">
                            {formatDateRange(dates.check_in, dates.check_out)}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {rooms} · {booking.party_size} guests
                        </p>
                        {booking.notes && (
                          <p className="mt-2 text-sm italic">
                            &ldquo;{booking.notes}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAction(booking.id, 'approve')}
                        disabled={loading === booking.id}
                      >
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeclineId(booking.id)}
                        disabled={loading === booking.id}
                      >
                        Decline
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold">Recent</h2>
          <div className="mt-4 space-y-3">
            {recent.slice(0, 10).map((booking) => {
              const dates = Array.isArray(booking.dates)
                ? booking.dates[0]
                : booking.dates;
              return (
                <Card key={booking.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">
                        {booking.guest.name ?? booking.guest.email}
                      </p>
                      {dates && (
                        <p className="text-sm text-muted-foreground">
                          {formatDateRange(dates.check_in, dates.check_out)}
                        </p>
                      )}
                      <p className="text-xs capitalize text-muted-foreground">
                        {booking.status}
                      </p>
                    </div>
                    {booking.status === 'approved' && (
                      <AddToCalendarButton bookingId={booking.id} />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      <Dialog open={!!declineId} onOpenChange={() => setDeclineId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline request</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder="Optional message to guest..."
            value={declineMessage}
            onChange={(e) => setDeclineMessage(e.target.value)}
          />
          <Button
            variant="destructive"
            onClick={() =>
              declineId &&
              handleAction(declineId, 'decline', declineMessage || undefined)
            }
            disabled={loading === declineId}
          >
            Decline request
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
