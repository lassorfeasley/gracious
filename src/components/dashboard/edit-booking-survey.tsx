'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, X, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDateRange } from '@/lib/dates';
import { useBooking } from '@/components/guest/booking-context';
import { HouseCalendar } from '@/components/guest/house-calendar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { BookingWithDetails } from '@/types/database';

type StepKey = 'dates' | 'rooms' | 'details' | 'review';

const STEPS: StepKey[] = ['dates', 'rooms', 'details', 'review'];

const STEP_TITLES: Record<StepKey, string> = {
  dates: 'When is the stay?',
  rooms: 'Which rooms are included?',
  details: 'Guests and notes',
  review: 'Review changes',
};

export function EditBookingSurvey({
  open,
  onOpenChange,
  booking,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails;
}) {
  const router = useRouter();
  const {
    checkIn,
    checkOut,
    guests,
    setGuests,
    maxGuests,
    rooms,
    selectedRoomIds,
    toggleRoom,
  } = useBooking();

  const [step, setStep] = useState(0);
  const [notes, setNotes] = useState(booking.notes ?? '');
  const [loading, setLoading] = useState(false);

  const current = Math.min(step, STEPS.length - 1);
  const stepKey = STEPS[current];
  const isLast = current === STEPS.length - 1;

  const selectedRooms = rooms.filter((r) => selectedRoomIds.includes(r.id));
  const roomsLabel =
    selectedRoomIds.length === rooms.length
      ? 'Entire place'
      : selectedRooms.map((r) => r.name).join(', ') || '—';

  function validateStep(key: StepKey): boolean {
    if (key === 'dates') {
      if (!checkIn || !checkOut) {
        toast.error('Select check-in and check-out dates');
        return false;
      }
    }
    if (key === 'rooms' && selectedRoomIds.length === 0) {
      toast.error('Select at least one room');
      return false;
    }
    return true;
  }

  function goNext() {
    if (!validateStep(stepKey)) return;
    setStep(current + 1);
  }

  async function handleSave() {
    if (!checkIn || !checkOut) {
      toast.error('Select check-in and check-out dates');
      return;
    }
    if (selectedRoomIds.length === 0) {
      toast.error('Select at least one room');
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/bookings/${booking.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update',
        check_in: checkIn,
        check_out: checkOut,
        room_ids: selectedRoomIds,
        party_size: guests,
        notes: notes.trim() || undefined,
      }),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(
        typeof data.error === 'string' ? data.error : 'Could not update booking'
      );
      return;
    }
    toast.success('Booking updated');
    onOpenChange(false);
    setStep(0);
    router.refresh();
  }

  const notifies =
    booking.status === 'approved' &&
    booking.notify_guest &&
    !!booking.guest.email;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,820px)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <div className="shrink-0 border-b px-8 pb-5 pt-8">
          <DialogHeader>
            <DialogTitle>Edit booking</DialogTitle>
          </DialogHeader>
          <div className="mt-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-300"
                style={{ width: `${((current + 1) / STEPS.length) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Step {current + 1} of {STEPS.length}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          <h3 className="text-xl font-semibold tracking-tight">
            {STEP_TITLES[stepKey]}
          </h3>

          <div className="mt-6">
            {stepKey === 'dates' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Select new check-in and check-out dates. The current stay&apos;s
                  nights are available to reselect.
                </p>
                <HouseCalendar monthsToShow={1} />
                <div className="rounded-xl border p-4 text-sm">
                  <span className="font-medium">
                    {checkIn && checkOut
                      ? formatDateRange(checkIn, checkOut)
                      : 'No dates selected'}
                  </span>
                </div>
              </div>
            )}

            {stepKey === 'rooms' && (
              <div className="space-y-4">
                <div className="flex min-h-10 flex-wrap gap-2">
                  {selectedRooms.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No rooms selected yet.
                    </p>
                  ) : (
                    selectedRooms.map((room) => (
                      <Badge
                        key={room.id}
                        variant="secondary"
                        className="gap-1 py-1.5 pl-3 pr-1.5 text-sm font-normal"
                      >
                        {room.name}
                        <button
                          type="button"
                          onClick={() => toggleRoom(room.id)}
                          className="rounded-sm p-0.5 hover:bg-muted-foreground/20"
                          aria-label={`Remove ${room.name}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {rooms
                    .filter((r) => !selectedRoomIds.includes(r.id))
                    .map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={() => toggleRoom(room.id)}
                        className="rounded-full border px-3 py-1.5 text-sm transition-colors hover:bg-muted"
                      >
                        <Plus className="mr-1 inline h-3.5 w-3.5" />
                        {room.name}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {stepKey === 'details' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
                  <div>
                    <p className="font-medium">Guests</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Up to {maxGuests} for the selected rooms.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setGuests(guests - 1)}
                      disabled={guests <= 1}
                      aria-label="Fewer guests"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-6 text-center text-sm font-medium">
                      {guests}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setGuests(guests + 1)}
                      disabled={guests >= maxGuests}
                      aria-label="More guests"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-notes">Notes (optional)</Label>
                  <Textarea
                    id="edit-notes"
                    rows={4}
                    placeholder="Internal notes about this stay"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            )}

            {stepKey === 'review' && (
              <dl className="space-y-4 text-sm">
                <div className="rounded-xl border p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Dates
                  </dt>
                  <dd className="mt-1 font-medium">
                    {checkIn && checkOut
                      ? formatDateRange(checkIn, checkOut)
                      : '—'}
                  </dd>
                </div>
                <div className="rounded-xl border p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Rooms & guests
                  </dt>
                  <dd className="mt-1 font-medium">
                    {roomsLabel} · {guests} {guests === 1 ? 'guest' : 'guests'}
                  </dd>
                </div>
                {notes.trim() && (
                  <div className="rounded-xl border p-4">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Notes
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap">{notes}</dd>
                  </div>
                )}
                {notifies && (
                  <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                    The guest will be notified of these changes by email.
                  </p>
                )}
              </dl>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center justify-between border-t px-8 py-5">
          {current > 0 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(current - 1)}
              disabled={loading}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          ) : (
            <span />
          )}
          <Button
            type="button"
            size="lg"
            onClick={isLast ? handleSave : goNext}
            disabled={loading}
          >
            {isLast ? (loading ? 'Saving…' : 'Save changes') : 'Next'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
