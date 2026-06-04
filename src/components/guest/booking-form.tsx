'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import type { InvitationWithDetails, Room } from '@/types/database';
import { formatDateRange } from '@/lib/dates';

const formSchema = z.object({
  check_in: z.string().min(1, 'Check-in is required'),
  check_out: z.string().min(1, 'Check-out is required'),
  room_ids: z.array(z.string()).min(1, 'Select at least one room'),
  party_size: z.number().min(1, 'At least 1 guest'),
  notes: z.string().optional(),
  guest_name: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface BookingFormProps {
  invitation: InvitationWithDetails;
  isAuthenticated: boolean;
  guestEmail: string;
  guestName?: string | null;
  /** When set, the form is locked to booking this single room. */
  lockedRoom?: Room;
}

export function BookingForm({
  invitation,
  isAuthenticated,
  guestEmail,
  guestName,
  lockedRoom,
}: BookingFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const isPrixFixe = invitation.type === 'prix_fixe';
  const defaultWindow = invitation.windows[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      check_in: isPrixFixe && defaultWindow ? defaultWindow.start_date : '',
      check_out: isPrixFixe && defaultWindow ? defaultWindow.end_date : '',
      room_ids: lockedRoom
        ? [lockedRoom.id]
        : isPrixFixe
          ? invitation.rooms.map((r) => r.id)
          : [],
      party_size: 1,
      notes: '',
      guest_name: guestName ?? '',
    },
  });

  const selectedRooms = form.watch('room_ids');

  function toggleRoom(roomId: string) {
    if (isPrixFixe || lockedRoom) return;
    const current = form.getValues('room_ids');
    if (current.includes(roomId)) {
      form.setValue(
        'room_ids',
        current.filter((id) => id !== roomId),
        { shouldValidate: true }
      );
    } else {
      form.setValue('room_ids', [...current, roomId], { shouldValidate: true });
    }
  }

  async function onSubmit(values: FormValues) {
    if (!isAuthenticated) {
      toast.error('Please sign in first using the magic link');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          invitation_token: invitation.token,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const err =
          typeof data.error === 'string'
            ? data.error
            : Object.values(data.error ?? {}).flat().join(', ');
        toast.error(err || 'Failed to submit request');
        return;
      }
      toast.success(
        isPrixFixe ? 'Stay accepted! Awaiting confirmation.' : 'Stay request submitted!'
      );
      setOpen(false);
      router.push('/my-trips');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const ctaLabel = isPrixFixe ? 'Accept Stay' : 'Request Stay';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto">
          {ctaLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{ctaLabel}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {!guestName && (
              <FormField
                control={form.control}
                name="guest_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your name</FormLabel>
                    <FormControl>
                      <Input placeholder="How should we address you?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {lockedRoom && (
              <div className="rounded-lg border p-3">
                <p className="text-xs text-muted-foreground">Booking</p>
                <p className="font-medium">{lockedRoom.name}</p>
                <p className="text-xs text-muted-foreground">
                  Up to {lockedRoom.max_occupancy} guests
                </p>
              </div>
            )}

            {!isPrixFixe && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="check_in"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-in</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="check_out"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check-out</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {!lockedRoom && (
                  <div className="space-y-2">
                    <Label>Rooms</Label>
                    <div className="space-y-2">
                      {invitation.rooms.map((room: Room) => (
                        <label
                          key={room.id}
                          className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-checked:border-foreground"
                        >
                          <Checkbox
                            checked={selectedRooms.includes(room.id)}
                            onCheckedChange={() => toggleRoom(room.id)}
                          />
                          <div>
                            <p className="font-medium">{room.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Up to {room.max_occupancy} guests
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {form.formState.errors.room_ids && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.room_ids.message}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            {isPrixFixe && defaultWindow && (
              <p className="rounded-lg bg-muted p-3 text-sm">
                Fixed dates:{' '}
                <strong>
                  {formatDateRange(defaultWindow.start_date, defaultWindow.end_date)}
                </strong>
              </p>
            )}

            <FormField
              control={form.control}
              name="party_size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Party size</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Max for selected rooms:{' '}
                    {lockedRoom
                      ? lockedRoom.max_occupancy
                      : invitation.rooms
                          .filter(
                            (r) => selectedRooms.includes(r.id) || isPrixFixe
                          )
                          .reduce((s, r) => s + r.max_occupancy, 0) || '—'}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note to host (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Anything the host should know..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isAuthenticated && (
              <p className="text-sm text-amber-600">
                You need to sign in first. Close this dialog and use the magic link
                button for {guestEmail}.
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isAuthenticated}
            >
              {loading ? 'Submitting...' : ctaLabel}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
