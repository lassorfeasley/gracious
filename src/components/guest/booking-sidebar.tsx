'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseISO, format, differenceInCalendarDays } from 'date-fns';
import { Minus, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { MagicLinkForm } from '@/components/guest/magic-link-form';
import { GuestManageStayCard } from '@/components/guest/guest-manage-stay-card';
import { SelectableRoomCalendar } from '@/components/guest/selectable-room-calendar';
import {
  resolveGuestPreviewUi,
  type GuestPreviewAs,
  type GuestPreviewBookingStatus,
} from '@/lib/guest-preview';
import {
  guestBookingCtaLabel,
  guestBookingSidebarNote,
  guestBookingSuccessMessage,
} from '@/lib/invitation-booking';
import { useBooking } from './booking-context';
import type { InvitationWithDetails, Room } from '@/types/database';

interface CalendarBooking {
  id: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
}

interface CalendarBlock {
  id: string;
  start_date: string;
  end_date: string;
}

interface DateRange {
  start: string;
  end: string;
}

interface BookingSidebarProps {
  invitation: InvitationWithDetails;
  propertyName: string;
  room: Room;
  isAuthenticated: boolean;
  previewMode?: boolean;
  guestPreviewAs?: GuestPreviewAs;
  guestPreviewBookingStatus?: GuestPreviewBookingStatus;
  isPrixFixe?: boolean;
  maxGuests: number;
  bookings: CalendarBooking[];
  blocks: CalendarBlock[];
  allowedRanges?: DateRange[];
}

function formatBox(date: string | null): string {
  if (!date) return 'Add date';
  return format(parseISO(date), 'EEE, MMM d');
}

function DateBox({
  label,
  value,
  active,
  editable,
  onClick,
}: {
  label: string;
  value: string;
  active: boolean;
  editable: boolean;
  onClick: () => void;
}) {
  const content = (
    <>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm">{value}</p>
    </>
  );

  if (!editable) {
    return <div className="p-3">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'p-3 text-left transition-colors hover:bg-muted/50',
        active && 'rounded-[10px] ring-2 ring-inset ring-foreground'
      )}
    >
      {content}
    </button>
  );
}

export function BookingSidebar({
  invitation,
  propertyName,
  room,
  isAuthenticated,
  previewMode = false,
  guestPreviewAs = 'booking',
  guestPreviewBookingStatus = 'requested',
  isPrixFixe = false,
  maxGuests,
  bookings,
  blocks,
  allowedRanges,
}: BookingSidebarProps) {
  const router = useRouter();
  const { checkIn, checkOut, guests, activeField, setGuests, setActiveField, clear } =
    useBooking();
  const previewUi = resolveGuestPreviewUi(
    previewMode,
    guestPreviewAs,
    isAuthenticated
  );
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  function openField(field: 'checkIn' | 'checkOut') {
    if (isPrixFixe) return;
    setActiveField(field);
    setCalendarOpen(true);
  }

  const nights =
    checkIn && checkOut
      ? differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn))
      : 0;
  const ctaLabel = guestBookingCtaLabel(invitation);

  async function handleReserve() {
    if (!checkIn || !checkOut) {
      toast.error('Select your dates on the calendar');
      return;
    }

    const payload = {
      check_in: checkIn,
      check_out: checkOut,
      room_ids: [room.id],
      party_size: guests,
      notes: '',
      guest_first_name: invitation.guest_first_name ?? undefined,
      guest_last_name: invitation.guest_last_name ?? undefined,
      invitation_token: invitation.token,
    };

    if (previewMode) {
      toast.info('Preview mode — no booking was submitted', {
        description: `${formatBox(checkIn)} → ${formatBox(checkOut)} · party of ${guests}`,
      });
      return;
    }

    if (!previewUi.effectiveAuthenticated) {
      toast.error('Please sign in first using the magic link');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        const err =
          typeof data.error === 'string'
            ? data.error
            : Object.values(data.error ?? {})
                .flat()
                .join(', ');
        toast.error(err || 'Failed to submit request');
        return;
      }
      toast.success(guestBookingSuccessMessage(invitation));
      router.push('/my-trips');
      router.refresh();
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const sampleCheckIn =
    checkIn ?? invitation.windows[0]?.start_date ?? '2026-06-10';
  const sampleCheckOut =
    checkOut ?? invitation.windows[0]?.end_date ?? '2026-06-15';

  if (previewUi.showManageStay) {
    return (
      <GuestManageStayCard
        propertyName={propertyName}
        checkIn={sampleCheckIn}
        checkOut={sampleCheckOut}
        roomNames={[room.name]}
        partySize={guests}
        bookingStatus={guestPreviewBookingStatus}
        previewMode={previewMode}
      />
    );
  }

  if (previewUi.showSignIn) {
    return (
      <div className="rounded-2xl p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
        <p className="text-lg font-semibold">Sign in to book</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We&apos;ll send a magic link to your invited email.
        </p>
        <div className="mt-4">
          <MagicLinkForm
            email={invitation.guest_email}
            token={invitation.token}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-6 shadow-[0_6px_16px_rgba(0,0,0,0.12)]">
      <div className="flex items-baseline justify-between">
        <p className="text-xl font-semibold">
          {nights > 0
            ? `${nights} ${nights === 1 ? 'night' : 'nights'}`
            : 'Add your dates'}
        </p>
        {nights > 0 && (
          <p className="text-sm text-muted-foreground">
            {format(parseISO(checkIn!), 'MMM d')} –{' '}
            {format(parseISO(checkOut!), 'MMM d')}
          </p>
        )}
      </div>

      <Popover
        open={calendarOpen}
        onOpenChange={(open) => {
          setCalendarOpen(open);
          if (!open) setActiveField(null);
        }}
      >
        <PopoverAnchor asChild>
          <div className="mt-4 overflow-hidden rounded-xl border">
            <div className="grid grid-cols-2 divide-x">
              <DateBox
                label="Check-in"
                value={formatBox(checkIn)}
                active={calendarOpen && activeField === 'checkIn'}
                editable={!isPrixFixe}
                onClick={() => openField('checkIn')}
              />
              <DateBox
                label="Checkout"
                value={formatBox(checkOut)}
                active={calendarOpen && activeField === 'checkOut'}
                editable={!isPrixFixe}
                onClick={() => openField('checkOut')}
              />
            </div>
            <div className="flex items-center justify-between border-t p-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Guests
                </p>
                <p className="mt-0.5 text-sm">
                  {guests} {guests === 1 ? 'guest' : 'guests'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  aria-label="Decrease guests"
                  disabled={guests <= 1}
                  onClick={() => setGuests(Math.max(1, guests - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-4 text-center text-sm tabular-nums">
                  {guests}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  aria-label="Increase guests"
                  disabled={guests >= maxGuests}
                  onClick={() => setGuests(Math.min(maxGuests, guests + 1))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </PopoverAnchor>
        <PopoverContent align="end" sideOffset={8} className="w-[320px] p-3">
          <SelectableRoomCalendar
            bookings={bookings}
            blocks={blocks}
            allowedRanges={allowedRanges}
            monthsToShow={1}
          />
          <div className="mt-2 flex items-center justify-between border-t pt-3">
            <button
              type="button"
              onClick={clear}
              className="text-sm font-medium underline underline-offset-2"
            >
              Clear dates
            </button>
            <Button
              type="button"
              size="sm"
              onClick={() => setCalendarOpen(false)}
            >
              Close
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        className="mt-4 w-full"
        size="lg"
        onClick={handleReserve}
        disabled={loading}
      >
        {loading
          ? 'Submitting...'
          : previewMode
            ? `${ctaLabel} (preview)`
            : ctaLabel}
      </Button>

      <p className="mt-3 text-center text-sm text-muted-foreground">
        {guestBookingSidebarNote(invitation)}
      </p>

      {!isPrixFixe && (checkIn || checkOut) && (
        <button
          type="button"
          onClick={clear}
          className="mx-auto mt-3 block text-sm font-medium underline underline-offset-2"
        >
          Clear dates
        </button>
      )}
    </div>
  );
}
