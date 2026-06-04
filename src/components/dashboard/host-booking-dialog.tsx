'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { hostBookingSchema, type HostBookingInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { CalendarPlus } from 'lucide-react';
import type { Room } from '@/types/database';

interface HostBookingDialogProps {
  propertyId: string;
  rooms: Room[];
}

export function HostBookingDialog({ propertyId, rooms }: HostBookingDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<HostBookingInput>({
    resolver: zodResolver(hostBookingSchema),
    defaultValues: {
      property_id: propertyId,
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      check_in: '',
      check_out: '',
      room_ids: [],
      party_size: 1,
      notes: '',
      notify_guest: false,
    },
  });

  const guestEmail = form.watch('guest_email');
  const hasEmail = !!guestEmail?.trim();

  function toggleRoom(roomId: string) {
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

  async function onSubmit(values: HostBookingInput) {
    setLoading(true);
    const res = await fetch('/api/bookings/host', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...values,
        property_id: propertyId,
        guest_email: values.guest_email?.trim() || undefined,
        guest_phone: values.guest_phone?.trim() || undefined,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(
        typeof data.error === 'string'
          ? data.error
          : 'Failed to create booking'
      );
      return;
    }

    toast.success('Guest booked');
    setOpen(false);
    form.reset({
      property_id: propertyId,
      guest_name: '',
      guest_email: '',
      guest_phone: '',
      check_in: '',
      check_out: '',
      room_ids: [],
      party_size: 1,
      notes: '',
      notify_guest: false,
    });
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={rooms.length === 0}>
          <CalendarPlus className="mr-1 h-4 w-4" />
          Book a guest
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book a guest</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="guest_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guest_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest email (optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        if (!e.target.value.trim()) {
                          form.setValue('notify_guest', false);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="guest_phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Guest phone (optional)</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10) || 1)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Rooms</Label>
              <div className="space-y-2">
                {rooms.map((room) => (
                  <label
                    key={room.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Checkbox
                      checked={form.watch('room_ids').includes(room.id)}
                      onCheckedChange={() => toggleRoom(room.id)}
                    />
                    {room.name}
                  </label>
                ))}
              </div>
              {form.formState.errors.room_ids && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.room_ids.message}
                </p>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notify_guest"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Send guest emails</FormLabel>
                    <FormDescription>
                      Confirmation, house info, and check-in reminders
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!hasEmail}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Booking...' : 'Confirm booking'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
