'use client';

import Link from 'next/link';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useBareCard } from '@/components/card-chrome';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StaySummaryList } from '@/components/stay-summary-list';
import { AddToCalendarButton } from '@/components/add-to-calendar-button';
import type { GuestPreviewVisitStatus } from '@/lib/guest-preview';

const statusVariant: Record<
  GuestPreviewVisitStatus,
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
  visitStatus: GuestPreviewVisitStatus;
  /** Real booking id — enables the live add-to-calendar menu. */
  visitId?: string;
  previewMode?: boolean;
}

export function GuestManageStayCard({
  propertyName,
  checkIn,
  checkOut,
  roomNames,
  partySize,
  visitStatus,
  visitId,
  previewMode = false,
}: GuestManageStayCardProps) {
  const bare = useBareCard();
  return (
    <div className={cn('p-6', !bare && 'rounded-2xl border shadow-sm')}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold">Your stay</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{propertyName}</p>
        </div>
        <Badge variant={statusVariant[visitStatus]}>{visitStatus}</Badge>
      </div>

      <div className="mt-5">
        <StaySummaryList
          checkIn={checkIn}
          checkOut={checkOut}
          roomNames={roomNames}
          partySize={partySize}
          boxed
        />
      </div>

      {visitStatus === 'requested' && (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          Your host will review this request. You&apos;ll be notified when it&apos;s
          confirmed.
        </p>
      )}

      {visitStatus === 'approved' && (
        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
          You&apos;re confirmed for this stay. See your trip details below for
          arrival and checkout notes.
        </p>
      )}

      <div className="mt-5 flex flex-col gap-2">
        <Button variant="outline" className="w-full" asChild>
          <Link href="/my-trips">View all trips</Link>
        </Button>
        {visitStatus === 'approved' &&
          (visitId ? (
            <AddToCalendarButton
              visitId={visitId}
              size="default"
              className="w-full"
            />
          ) : (
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
          ))}
        {(visitStatus === 'requested' || visitStatus === 'approved') && (
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
          ? 'Preview of post-visit management UI'
          : 'Manage your visit from My trips'}
      </p>
    </div>
  );
}
