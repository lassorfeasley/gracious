'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invitationSchema, type InvitationInput } from '@/lib/validations';
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
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { UserPlus, ArrowLeft, Check, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import type { Room } from '@/types/database';
import { cn } from '@/lib/utils';

interface InviteGuestDialogProps {
  propertyId: string;
  rooms: Room[];
  /** Rooms checked by default when the dialog opens. */
  preselectedRoomIds?: string[];
  /** Custom trigger element. Falls back to a standard "Invite guest" button. */
  trigger?: ReactNode;
}

type StepKey = 'guest' | 'type' | 'dates' | 'rooms' | 'details';

const STEP_TITLES: Record<StepKey, string> = {
  guest: 'Who are you inviting?',
  type: 'What kind of invitation?',
  dates: 'When can they come?',
  rooms: 'Which rooms can they book?',
  details: 'Add a personal touch',
};

const TYPE_OPTIONS: {
  value: InvitationInput['type'];
  label: string;
  description: string;
}[] = [
  {
    value: 'standing',
    label: 'Standing',
    description: 'Open invite — they can request any available dates.',
  },
  {
    value: 'date_offer',
    label: 'Date offer',
    description: 'They choose dates within specific windows you offer.',
  },
  {
    value: 'prix_fixe',
    label: 'Prix fixe',
    description: 'A fixed set of dates they can accept as-is.',
  },
];

export function InviteGuestDialog({
  propertyId,
  rooms,
  preselectedRoomIds,
  trigger,
}: InviteGuestDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [windows, setWindows] = useState<{ start_date: string; end_date: string }[]>([
    { start_date: '', end_date: '' },
  ]);

  const defaultRoomIds = (preselectedRoomIds ?? []).filter((id) =>
    rooms.some((r) => r.id === id)
  );

  const form = useForm<InvitationInput>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      guest_email: '',
      guest_name: '',
      type: 'standing',
      requires_approval: true,
      message: '',
      room_ids: defaultRoomIds,
    },
  });

  const invType = form.watch('type');

  const steps: StepKey[] = [
    'guest',
    'type',
    ...(invType !== 'standing' ? (['dates'] as StepKey[]) : []),
    'rooms',
    'details',
  ];
  const current = Math.min(step, steps.length - 1);
  const stepKey = steps[current];
  const isLast = current === steps.length - 1;

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      form.reset({
        guest_email: '',
        guest_name: '',
        type: 'standing',
        message: '',
        room_ids: defaultRoomIds,
      });
      setWindows([{ start_date: '', end_date: '' }]);
      setStep(0);
    }
  }

  function toggleRoom(roomId: string) {
    const value = form.getValues('room_ids');
    if (value.includes(roomId)) {
      form.setValue(
        'room_ids',
        value.filter((id) => id !== roomId),
        { shouldValidate: true }
      );
    } else {
      form.setValue('room_ids', [...value, roomId], { shouldValidate: true });
    }
  }

  async function goNext() {
    if (stepKey === 'guest') {
      const ok = await form.trigger('guest_email');
      if (!ok) return;
    } else if (stepKey === 'dates') {
      if (!windows.some((w) => w.start_date && w.end_date)) {
        toast.error('Add at least one date window');
        return;
      }
    } else if (stepKey === 'rooms') {
      const ok = await form.trigger('room_ids');
      if (!ok) return;
    }
    setStep(current + 1);
  }

  function handleFormSubmit(e: React.FormEvent) {
    if (!isLast) {
      e.preventDefault();
      goNext();
      return;
    }
    form.handleSubmit(onSubmit)(e);
  }

  async function onSubmit(values: InvitationInput) {
    setLoading(true);
    const payload = {
      property_id: propertyId,
      ...values,
      windows:
        values.type !== 'standing'
          ? windows.filter((w) => w.start_date && w.end_date)
          : undefined,
    };

    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    const data = await res.json();

    if (!res.ok) {
      toast.error(
        typeof data.error === 'string' ? data.error : 'Failed to create invitation'
      );
      return;
    }

    if (data.emailSent === false) {
      toast.warning(
        'Invitation created, but the email could not be sent. Use “Copy link” on the Guests page to share it manually.'
      );
    } else {
      toast.success('Invitation sent!');
    }
    setOpen(false);
    form.reset();
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" disabled={rooms.length === 0}>
            <UserPlus className="mr-1 h-4 w-4" />
            Invite a guest
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite a guest</DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div>
          <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-all"
              style={{ width: `${((current + 1) / steps.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Step {current + 1} of {steps.length}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={handleFormSubmit} className="space-y-5">
            <h3 className="text-lg font-semibold tracking-tight">
              {STEP_TITLES[stepKey]}
            </h3>

            {stepKey === 'guest' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="guest_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guest email</FormLabel>
                      <FormControl>
                        <Input type="email" autoFocus {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guest_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guest name (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {stepKey === 'type' && (
              <div className="space-y-3">
                {TYPE_OPTIONS.map((opt) => {
                  const selected = invType === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => form.setValue('type', opt.value)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 rounded-lg border p-4 text-left transition-colors',
                        selected
                          ? 'border-foreground ring-1 ring-foreground'
                          : 'hover:bg-muted'
                      )}
                    >
                      <div>
                        <p className="font-medium">{opt.label}</p>
                        <p className="text-sm text-muted-foreground">
                          {opt.description}
                        </p>
                      </div>
                      {selected && <Check className="h-5 w-5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {stepKey === 'dates' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {invType === 'prix_fixe'
                    ? 'Offer the exact dates of the stay.'
                    : 'Offer one or more date ranges they can book within.'}
                </p>
                {windows.map((w, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={w.start_date}
                      onChange={(e) => {
                        const next = [...windows];
                        next[i] = { ...next[i], start_date: e.target.value };
                        setWindows(next);
                      }}
                    />
                    <Input
                      type="date"
                      value={w.end_date}
                      onChange={(e) => {
                        const next = [...windows];
                        next[i] = { ...next[i], end_date: e.target.value };
                        setWindows(next);
                      }}
                    />
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setWindows([...windows, { start_date: '', end_date: '' }])
                  }
                >
                  Add window
                </Button>
              </div>
            )}

            {stepKey === 'rooms' && (
              <div className="space-y-2">
                <div className="space-y-2">
                  {rooms.map((room) => {
                    const checked = form.watch('room_ids').includes(room.id);
                    return (
                      <label
                        key={room.id}
                        className={cn(
                          'flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors',
                          checked ? 'border-foreground' : 'hover:bg-muted'
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={() => toggleRoom(room.id)}
                        />
                        {room.name}
                      </label>
                    );
                  })}
                </div>
                {form.formState.errors.room_ids && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.room_ids.message}
                  </p>
                )}
              </div>
            )}

            {stepKey === 'details' && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="requires_approval"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start justify-between gap-4 rounded-lg border p-4">
                      <div className="space-y-1">
                        <FormLabel className="text-base">
                          Require host approval
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          {field.value
                            ? 'Guests submit a request; you approve or decline before the stay is confirmed.'
                            : 'Bookings are confirmed immediately — no request in your inbox.'}
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          aria-label="Require host approval for bookings"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal message (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Can't wait to host you!"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="expires_at"
                  render={({ field }) => {
                    const selected = field.value
                      ? new Date(field.value)
                      : undefined;
                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>Invitation expires (optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                className={cn(
                                  'justify-start text-left font-normal',
                                  !selected && 'text-muted-foreground'
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selected
                                  ? format(selected, 'PPP')
                                  : 'No expiration'}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-auto p-0"
                            align="start"
                          >
                            <Calendar
                              mode="single"
                              selected={selected}
                              onSelect={(d) => {
                                if (!d) {
                                  field.onChange('');
                                  return;
                                }
                                const end = new Date(d);
                                end.setHours(23, 59, 59, 0);
                                field.onChange(end.toISOString());
                              }}
                              disabled={{ before: new Date() }}
                              autoFocus
                            />
                            {selected && (
                              <div className="border-t p-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="w-full"
                                  onClick={() => field.onChange('')}
                                >
                                  Clear date
                                </Button>
                              </div>
                            )}
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              {current > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep(current - 1)}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button type="submit" disabled={loading}>
                {isLast
                  ? loading
                    ? 'Sending...'
                    : 'Send invitation'
                  : 'Next'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
