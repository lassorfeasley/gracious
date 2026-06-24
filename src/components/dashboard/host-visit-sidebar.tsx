'use client';

import { useState } from 'react';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { Check, Minus, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateRange } from '@/lib/dates';
import type { InvitationInput } from '@/lib/validations';
import type { Room } from '@/types/database';
import { useVisit } from '@/components/guest/visit-context';
import { HouseCalendar } from '@/components/guest/house-calendar';
import { HostVisitSurvey } from '@/components/dashboard/host-visit-survey';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';

export type HostActionType = 'invite' | 'manual';
export type HostInviteType = Exclude<InvitationInput['type'], 'standing'>;

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

export interface HostVisitSidebarProps {
  propertyId: string;
  actionType: HostActionType;
  onActionTypeChange: (type: HostActionType) => void;
  inviteType: HostInviteType;
  onInviteTypeChange: (type: HostInviteType) => void;
  rooms: Room[];
  windows: { start_date: string; end_date: string }[];
  onRemoveWindow: (index: number) => void;
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
  wholeHome: boolean;
  onWholeHomeChange: (v: boolean) => void;
  preApproved: boolean;
  onPreApprovedChange: (v: boolean) => void;
  notifyGuest: boolean;
  onNotifyGuestChange: (v: boolean) => void;
  datesEditable: boolean;
  calendarDisabled: boolean;
  loading: boolean;
  onSubmitInvite: () => void;
  onSubmitManual: () => void;
}

export function HostVisitSidebar({
  propertyId,
  actionType,
  onActionTypeChange,
  inviteType,
  onInviteTypeChange,
  rooms,
  windows,
  onRemoveWindow,
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
  wholeHome,
  onWholeHomeChange,
  preApproved,
  onPreApprovedChange,
  notifyGuest,
  onNotifyGuestChange,
  datesEditable,
  calendarDisabled,
  loading,
  onSubmitInvite,
  onSubmitManual,
}: HostVisitSidebarProps) {
  const {
    checkIn,
    checkOut,
    guests,
    activeField,
    setGuests,
    setActiveField,
    clear,
    maxGuests,
  } = useVisit();

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const nights =
    checkIn && checkOut
      ? differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn))
      : 0;

  const guestName = [guestFirstName.trim(), guestLastName.trim()]
    .filter(Boolean)
    .join(' ');

  function openField(field: 'checkIn' | 'checkOut') {
    if (!datesEditable) return;
    setActiveField(field);
    setCalendarOpen(true);
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-6 shadow-sm">
        <div className="flex items-baseline justify-between">
          <p className="text-xl font-semibold">
            {nights > 0
              ? `${nights} ${nights === 1 ? 'night' : 'nights'}`
              : 'Add your dates'}
          </p>
          {nights > 0 && checkIn && checkOut && (
            <p className="text-sm text-muted-foreground">
              {format(parseISO(checkIn), 'MMM d')} –{' '}
              {format(parseISO(checkOut), 'MMM d')}
            </p>
          )}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border">
          <Popover
            open={calendarOpen}
            onOpenChange={(open) => {
              setCalendarOpen(open);
              if (!open) setActiveField(null);
            }}
          >
            <PopoverAnchor asChild>
              <div>
                <div className="grid grid-cols-2 divide-x">
                  <DateBox
                    label="Check-in"
                    value={formatBox(checkIn)}
                    active={calendarOpen && activeField === 'checkIn'}
                    editable={datesEditable}
                    onClick={() => openField('checkIn')}
                  />
                  <DateBox
                    label="Checkout"
                    value={formatBox(checkOut)}
                    active={calendarOpen && activeField === 'checkOut'}
                    editable={datesEditable}
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
              <HouseCalendar monthsToShow={1} disabled={calendarDisabled} />
              <div className="mt-2 flex items-center justify-between border-t pt-3">
                {datesEditable && (
                  <button
                    type="button"
                    onClick={clear}
                    className="text-sm font-medium underline underline-offset-2"
                  >
                    Clear dates
                  </button>
                )}
                <Button
                  type="button"
                  size="sm"
                  className={!datesEditable ? 'ml-auto' : ''}
                  onClick={() => setCalendarOpen(false)}
                >
                  Close
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {(guestEmail || guestName) && (
          <p className="mt-3 text-sm text-muted-foreground">
            {guestName || guestEmail}
            {guestName && guestEmail ? ` · ${guestEmail}` : ''}
          </p>
        )}

        <Button
          className="mt-4 w-full"
          size="lg"
          onClick={() => setDetailsOpen(true)}
          disabled={loading || rooms.length === 0}
        >
          Create invite
        </Button>

        <p className="mt-3 text-center text-sm text-muted-foreground">
          Your invite will not be sent yet.
        </p>

        {datesEditable && (checkIn || checkOut) && (
          <button
            type="button"
            onClick={clear}
            className="mx-auto mt-3 block text-sm font-medium underline underline-offset-2"
          >
            Clear dates
          </button>
        )}
      </div>

      {actionType === 'invite' && windows.length > 0 && (
        <div className="rounded-2xl border p-4 shadow-sm">
          <p className="text-sm font-medium">Offered dates</p>
          <ul className="mt-2 space-y-2">
            {windows.map((w, i) => (
              <li
                key={`${w.start_date}-${w.end_date}-${i}`}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDateRange(w.start_date, w.end_date)}
                </span>
                {inviteType === 'date_offer' && (
                  <button
                    type="button"
                    onClick={() => onRemoveWindow(i)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Remove window"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <HostVisitSurvey
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        propertyId={propertyId}
        rooms={rooms}
        actionType={actionType}
        onActionTypeChange={onActionTypeChange}
        inviteType={inviteType}
        onInviteTypeChange={onInviteTypeChange}
        windows={windows}
        guestEmail={guestEmail}
        onGuestEmailChange={onGuestEmailChange}
        guestFirstName={guestFirstName}
        onGuestFirstNameChange={onGuestFirstNameChange}
        guestLastName={guestLastName}
        onGuestLastNameChange={onGuestLastNameChange}
        guestPhone={guestPhone}
        onGuestPhoneChange={onGuestPhoneChange}
        message={message}
        onMessageChange={onMessageChange}
        notes={notes}
        onNotesChange={onNotesChange}
        requiresApproval={requiresApproval}
        onRequiresApprovalChange={onRequiresApprovalChange}
        wholeHome={wholeHome}
        onWholeHomeChange={onWholeHomeChange}
        preApproved={preApproved}
        onPreApprovedChange={onPreApprovedChange}
        notifyGuest={notifyGuest}
        onNotifyGuestChange={onNotifyGuestChange}
        loading={loading}
        onSubmitInvite={onSubmitInvite}
        onSubmitManual={onSubmitManual}
      />
    </div>
  );
}
