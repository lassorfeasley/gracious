'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { formatDateRange } from '@/lib/dates';
import type { Room } from '@/types/database';
import { useBooking } from '@/components/guest/booking-context';
import { InviteGuestDialog } from '@/components/dashboard/invite-guest-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { HostActionType, HostInviteType } from '@/components/dashboard/host-stay-sidebar';

type StepKey = 'kind' | 'rooms' | 'guest' | 'details' | 'review';

const STEPS: StepKey[] = ['kind', 'rooms', 'guest', 'details', 'review'];

const STEP_TITLES: Record<StepKey, string> = {
  kind: 'What kind of booking is this?',
  rooms: 'Which rooms are included?',
  guest: 'Who is the guest?',
  details: 'Any final details?',
  review: 'Review and confirm',
};

const INVITE_TYPE_OPTIONS: {
  value: HostInviteType;
  label: string;
  description: string;
}[] = [
  {
    value: 'date_offer',
    label: 'Date offer',
    description: 'They choose dates within the windows you added on the calendar.',
  },
  {
    value: 'prix_fixe',
    label: 'Fixed stay',
    description: 'Exact dates — they accept the stay as offered.',
  },
];

function guestDisplayName(first: string, last: string): string {
  return [first.trim(), last.trim()].filter(Boolean).join(' ');
}

function RoomPillPicker() {
  const [open, setOpen] = useState(false);
  const {
    rooms: bookableRooms,
    selectedRoomIds,
    toggleRoom,
    selectAllRooms,
    lockRoomSelection,
  } = useBooking();

  const selectedRooms = bookableRooms.filter((r) =>
    selectedRoomIds.includes(r.id)
  );
  const unselectedRooms = bookableRooms.filter(
    (r) => !selectedRoomIds.includes(r.id)
  );

  if (lockRoomSelection && selectedRooms.length === 1) {
    return (
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary" className="px-3 py-1.5 text-sm font-normal">
          {selectedRooms[0].name}
        </Badge>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex min-h-10 flex-wrap gap-2">
        {selectedRooms.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rooms selected yet.</p>
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

      <div className="flex flex-wrap items-center gap-2">
        {unselectedRooms.length > 0 && (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                <Plus className="mr-1 h-4 w-4" />
                Add room
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search rooms…" />
                <CommandList>
                  <CommandEmpty>No rooms found.</CommandEmpty>
                  <CommandGroup>
                    {unselectedRooms.map((room) => (
                      <CommandItem
                        key={room.id}
                        value={room.name}
                        onSelect={() => {
                          toggleRoom(room.id);
                          setOpen(false);
                        }}
                      >
                        <div>
                          <p>{room.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Up to {room.max_occupancy} guests
                          </p>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
        {bookableRooms.length > 1 &&
          selectedRoomIds.length < bookableRooms.length && (
            <button
              type="button"
              onClick={selectAllRooms}
              className="text-sm font-medium text-foreground underline underline-offset-2"
            >
              Select entire place
            </button>
          )}
      </div>
    </div>
  );
}

export function HostBookingSurvey({
  open,
  onOpenChange,
  propertyId,
  rooms,
  actionType,
  onActionTypeChange,
  inviteType,
  onInviteTypeChange,
  windows,
  guestEmail,
  onGuestEmailChange,
  guestFirstName,
  onGuestFirstNameChange,
  guestLastName,
  onGuestLastNameChange,
  guestPhone,
  onGuestPhoneChange,
  message,
  onMessageChange,
  notes,
  onNotesChange,
  requiresApproval,
  onRequiresApprovalChange,
  notifyGuest,
  onNotifyGuestChange,
  loading,
  onSubmitInvite,
  onSubmitManual,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  rooms: Room[];
  actionType: HostActionType;
  onActionTypeChange: (type: HostActionType) => void;
  inviteType: HostInviteType;
  onInviteTypeChange: (type: HostInviteType) => void;
  windows: { start_date: string; end_date: string }[];
  guestEmail: string;
  onGuestEmailChange: (v: string) => void;
  guestFirstName: string;
  onGuestFirstNameChange: (v: string) => void;
  guestLastName: string;
  onGuestLastNameChange: (v: string) => void;
  guestPhone: string;
  onGuestPhoneChange: (v: string) => void;
  message: string;
  onMessageChange: (v: string) => void;
  notes: string;
  onNotesChange: (v: string) => void;
  requiresApproval: boolean;
  onRequiresApprovalChange: (v: boolean) => void;
  notifyGuest: boolean;
  onNotifyGuestChange: (v: boolean) => void;
  loading: boolean;
  onSubmitInvite: () => void;
  onSubmitManual: () => void;
}) {
  const {
    checkIn,
    checkOut,
    guests,
    rooms: bookableRooms,
    selectedRoomIds,
    selectAllRooms,
    lockRoomSelection,
  } = useBooking();

  const [step, setStep] = useState(0);

  const steps = STEPS;
  const current = Math.min(step, steps.length - 1);
  const stepKey = steps[current];
  const isLast = current === steps.length - 1;

  const guestName = useMemo(
    () => guestDisplayName(guestFirstName, guestLastName),
    [guestFirstName, guestLastName]
  );

  useEffect(() => {
    if (open) {
      setStep(0);
      if (!lockRoomSelection) {
        selectAllRooms();
      }
    }
  }, [open, lockRoomSelection, selectAllRooms]);

  const roomsLabel =
    selectedRoomIds.length === bookableRooms.length
      ? 'Entire place'
      : selectedRoomIds.length === 1
        ? bookableRooms.find((r) => r.id === selectedRoomIds[0])?.name ?? '1 room'
        : `${selectedRoomIds.length} rooms`;

  const submitLabel =
    actionType === 'manual' ? 'Add to calendar' : 'Send invitation';

  function validateStep(key: StepKey): boolean {
    if (key === 'kind' && actionType === 'manual') {
      return true;
    }
    if (key === 'rooms' && selectedRoomIds.length === 0) {
      toast.error('Select at least one room');
      return false;
    }
    if (key === 'guest') {
      if (actionType === 'invite' && !guestEmail.trim()) {
        toast.error('Guest email is required');
        return false;
      }
      if (actionType === 'manual' && !guestFirstName.trim()) {
        toast.error('First name is required');
        return false;
      }
    }
    if (
      key === 'details' &&
      actionType === 'manual' &&
      notifyGuest &&
      !guestEmail.trim()
    ) {
      toast.error('Email is required to notify the guest');
      return false;
    }
    return true;
  }

  function validateSubmit(): boolean {
    if (selectedRoomIds.length === 0) {
      toast.error('Select at least one room');
      return false;
    }
    if (actionType === 'manual') {
      if (!checkIn || !checkOut) {
        toast.error('Select check-in and check-out on the sidebar');
        return false;
      }
      if (!guestFirstName.trim()) {
        toast.error('First name is required');
        return false;
      }
      if (notifyGuest && !guestEmail.trim()) {
        toast.error('Email is required to notify the guest');
        return false;
      }
      return true;
    }
    if (!guestEmail.trim()) {
      toast.error('Guest email is required');
      return false;
    }
    if (inviteType === 'prix_fixe') {
      if (windows.length === 0 && (!checkIn || !checkOut)) {
        toast.error('Select the fixed stay dates on the calendar');
        return false;
      }
      return true;
    }
    if (windows.length === 0) {
      toast.error('Add at least one date window on the calendar');
      return false;
    }
    return true;
  }

  function goNext() {
    if (!validateStep(stepKey)) return;
    setStep(current + 1);
  }

  function handleSubmit() {
    if (!validateSubmit()) return;
    if (actionType === 'manual') {
      onSubmitManual();
    } else {
      onSubmitInvite();
    }
  }

  function selectInviteType(type: HostInviteType) {
    onActionTypeChange('invite');
    onInviteTypeChange(type);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,820px)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <div className="shrink-0 border-b px-8 pb-5 pt-8">
          <DialogHeader>
            <DialogTitle>Finish your booking</DialogTitle>
          </DialogHeader>
          <div className="mt-5">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-300"
                style={{ width: `${((current + 1) / steps.length) * 100}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Step {current + 1} of {steps.length}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
          <h3 className="text-xl font-semibold tracking-tight">
            {STEP_TITLES[stepKey]}
          </h3>

          <div className="mt-6">
            {stepKey === 'kind' && (
              <div className="space-y-4">
                {actionType === 'manual' ? (
                  <div className="flex items-center justify-between gap-4 rounded-xl border border-foreground p-5 ring-1 ring-foreground">
                    <div>
                      <p className="font-medium">Manual stay</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Block the calendar for someone who won&apos;t use the app.
                      </p>
                    </div>
                    <Check className="h-5 w-5 shrink-0" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {INVITE_TYPE_OPTIONS.map((opt) => {
                      const selected =
                        actionType === 'invite' && inviteType === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => selectInviteType(opt.value)}
                          className={cn(
                            'flex w-full items-center justify-between gap-4 rounded-xl border p-5 text-left transition-colors',
                            selected
                              ? 'border-foreground ring-1 ring-foreground'
                              : 'hover:bg-muted/50'
                          )}
                        >
                          <div>
                            <p className="font-medium">{opt.label}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {opt.description}
                            </p>
                          </div>
                          {selected && <Check className="h-5 w-5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-2 border-t pt-5 text-sm text-muted-foreground">
                  {actionType === 'manual' ? (
                    <p>
                      Want to send an invitation instead?{' '}
                      <button
                        type="button"
                        onClick={() => selectInviteType('date_offer')}
                        className="font-medium text-foreground underline underline-offset-2"
                      >
                        Choose invitation type
                      </button>
                    </p>
                  ) : (
                    <p>
                      Adding a stay for someone who won&apos;t use the app?{' '}
                      <button
                        type="button"
                        onClick={() => onActionTypeChange('manual')}
                        className="font-medium text-foreground underline underline-offset-2"
                      >
                        Use manual stay
                      </button>
                    </p>
                  )}
                  <p>
                    Need an open invitation where guests pick their own dates?{' '}
                    <InviteGuestDialog
                      propertyId={propertyId}
                      rooms={rooms}
                      trigger={
                        <button
                          type="button"
                          className="font-medium text-foreground underline underline-offset-2"
                        >
                          Use quick invite form
                        </button>
                      }
                    />
                  </p>
                </div>
              </div>
            )}

            {stepKey === 'rooms' && <RoomPillPicker />}

            {stepKey === 'guest' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="survey-first-name">
                      First name{actionType === 'manual' ? '' : ' (optional)'}
                    </Label>
                    <Input
                      id="survey-first-name"
                      autoFocus
                      placeholder="First name"
                      value={guestFirstName}
                      onChange={(e) => onGuestFirstNameChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="survey-last-name">Last name (optional)</Label>
                    <Input
                      id="survey-last-name"
                      placeholder="Last name"
                      value={guestLastName}
                      onChange={(e) => onGuestLastNameChange(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="survey-email">
                    Email{actionType === 'invite' ? '' : ' (optional)'}
                  </Label>
                  <Input
                    id="survey-email"
                    type="email"
                    placeholder="guest@example.com"
                    value={guestEmail}
                    onChange={(e) => onGuestEmailChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="survey-phone">Phone (optional)</Label>
                  <Input
                    id="survey-phone"
                    type="tel"
                    placeholder="+1 555 000 0000"
                    value={guestPhone}
                    onChange={(e) => onGuestPhoneChange(e.target.value)}
                  />
                </div>
              </div>
            )}

            {stepKey === 'details' && actionType === 'invite' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="survey-message">Personal message (optional)</Label>
                  <Textarea
                    id="survey-message"
                    placeholder="A note to include in the invitation email"
                    rows={4}
                    value={message}
                    onChange={(e) => onMessageChange(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
                  <div>
                    <p className="font-medium">Require approval</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Guest requests need your OK before the stay is confirmed.
                    </p>
                  </div>
                  <Switch
                    checked={requiresApproval}
                    onCheckedChange={onRequiresApprovalChange}
                  />
                </div>
              </div>
            )}

            {stepKey === 'details' && actionType === 'manual' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="survey-notes">Notes (optional)</Label>
                  <Textarea
                    id="survey-notes"
                    placeholder="Internal notes about this stay"
                    rows={4}
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-xl border p-4">
                  <div>
                    <p className="font-medium">Send guest emails</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Requires an email from the previous step.
                    </p>
                  </div>
                  <Switch
                    checked={notifyGuest}
                    onCheckedChange={onNotifyGuestChange}
                    disabled={!guestEmail.trim()}
                  />
                </div>
              </div>
            )}

            {stepKey === 'review' && (
              <dl className="space-y-4 text-sm">
                <div className="rounded-xl border p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Type
                  </dt>
                  <dd className="mt-1 font-medium">
                    {actionType === 'manual'
                      ? 'Manual stay'
                      : inviteType === 'date_offer'
                        ? 'Date offer invitation'
                        : 'Fixed stay invitation'}
                  </dd>
                </div>
                <div className="rounded-xl border p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Dates
                  </dt>
                  <dd className="mt-1 font-medium">
                    {actionType === 'manual' && checkIn && checkOut
                      ? formatDateRange(checkIn, checkOut)
                      : windows.length > 0
                        ? windows
                            .map((w) => formatDateRange(w.start_date, w.end_date))
                            .join(' · ')
                        : checkIn && checkOut
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
                <div className="rounded-xl border p-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Guest
                  </dt>
                  <dd className="mt-1 font-medium">
                    {guestName || guestEmail || '—'}
                    {guestEmail ? (
                      <span className="block text-muted-foreground">{guestEmail}</span>
                    ) : null}
                    {guestPhone ? (
                      <span className="block text-muted-foreground">{guestPhone}</span>
                    ) : null}
                  </dd>
                </div>
                {actionType === 'invite' && message && (
                  <div className="rounded-xl border p-4">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Message
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap">{message}</dd>
                  </div>
                )}
                {actionType === 'invite' && (
                  <div className="rounded-xl border p-4">
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Approval
                    </dt>
                    <dd className="mt-1 font-medium">
                      {requiresApproval ? 'Required' : 'Not required'}
                    </dd>
                  </div>
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
            onClick={isLast ? handleSubmit : goNext}
            disabled={loading}
          >
            {isLast ? (loading ? 'Saving…' : submitLabel) : 'Next'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
