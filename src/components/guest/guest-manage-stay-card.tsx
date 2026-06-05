'use client';

import Link from 'next/link';
import { format, parseISO, differenceInCalendarDays } from 'date-fns';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateRange } from '@/lib/dates';
import type { GuestPreviewBookingStatus } from '@/lib/guest-preview';

const statusVariant: Record<
  GuestPreviewBookingStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  requested: 'secondary',
  approved: 'default',
};

interface GuestManageStayCardProps {
  propertyName: string;
  checkIn: string;
  checkOut: string;
  roomNames: string[];
  partySize: number;
  bookingStatus: GuestPreviewBookingStatus;
  previewMode?: boolean;
}

export function GuestManageStayCard({
  propertyName,
  checkIn,
  checkOut,
  roomNames,
  partySize,
  bookingStatus,
  previewMode = false,
}: GuestManageStayCardProps) {
  const nights = differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn));

  return (
    <div className="rounded-2xl border p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">Your stay</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{propertyName}</p>
        </div>
        <Badge variant={statusVariant[bookingStatus]}>{bookingStatus}</Badge>
      </div>

      <dl className="mt-5 space-y-3 text-sm">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Dates
          </dt>
          <dd className="mt-0.5 font-medium">
            {formatDateRange(checkIn, checkOut)}
            <span className="ml-1 font-normal text-muted-foreground">
              · {nights} {nights === 1 ? 'night' : 'nights'}
            </span>
          </dd>
        </div>
        {roomNames.length > 0 && (
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Rooms
            </dt>
            <dd className="mt-0.5">{roomNames.join(', ')}</dd>
          </div>
        )}
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Guests
          </dt>
          <dd className="mt-0.5">
            {partySize} {partySize === 1 ? 'guest' : 'guests'}
          </dd>
        </div>
      </dl>

      {bookingStatus === 'requested' && (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Your host will review this request. You&apos;ll be notified when it&apos;s
          confirmed.
        </p>
      )}

      {bookingStatus === 'approved' && (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          You&apos;re confirmed for this stay. Check guest information below for
          WiFi and check-in details.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/my-trips">View all trips</Link>
        </Button>
        {bookingStatus === 'approved' && (
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() =>
              toast.info('Preview mode — calendar download disabled')
            }
          >
            <Calendar className="mr-2 h-4 w-4" />
            Add to calendar
          </Button>
        )}
        {(bookingStatus === 'requested' || bookingStatus === 'approved') && (
          <Button
            type="button"
            variant="ghost"
            className="w-full text-destructive hover:text-destructive"
            onClick={() => {
              if (previewMode) {
                toast.info('Preview mode — cancel stay disabled');
              }
            }}
          >
            Cancel stay
          </Button>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        {previewMode
          ? 'Preview of post-booking management UI'
          : 'Manage your booking from My trips'}
      </p>
    </div>
  );
}
