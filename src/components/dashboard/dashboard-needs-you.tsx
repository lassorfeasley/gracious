'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner';
import {
  Check,
  X,
  Mail,
  Link2,
  CheckCircle2,
  MessageSquareText,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PersonAvatar } from '@/components/ui/person-avatar';
import { getInviteUrl } from '@/lib/invite-url';
import { INVITATION_TYPE_LABELS } from '@/lib/invitation-types';
import { formatDateRange } from '@/lib/dates';
import { cn } from '@/lib/utils';
import type { ActionQueueInvite, ActionQueueVisit } from '@/lib/dashboard-home';

type StackItem =
  | ({ kind: 'visit' } & ActionQueueVisit)
  | ({ kind: 'invite' } & ActionQueueInvite);

const EXIT_MS = 280;
const MAX_BEHIND = 2;

function formatBox(date: string | null): string {
  if (!date) return 'Open';
  return format(parseISO(date), 'EEE, MMM d');
}

function formatDay(date: string | null): string {
  if (!date) return '—';
  return format(parseISO(date), 'MMM d, yyyy');
}

function dateRangeLabel(checkIn: string | null, checkOut: string | null): string {
  if (checkIn && checkOut) return formatDateRange(checkIn, checkOut);
  if (checkIn) return `From ${format(parseISO(checkIn), 'MMM d')}`;
  return 'Open dates';
}

function firstName(name: string): string {
  return name.split(/\s+/)[0] || name;
}

function inviteShareBody(invite: ActionQueueInvite): string {
  const first = firstName(invite.guestName);
  const greeting = first && first !== invite.email ? `Hi ${first}, ` : '';
  return `${greeting}you're invited to stay at ${invite.propertyName}. View the details and pick your dates here: ${getInviteUrl(invite.token)}`;
}

function inviteMailHref(invite: ActionQueueInvite): string | null {
  if (!invite.email) return null;
  return `mailto:${encodeURIComponent(invite.email)}?subject=${encodeURIComponent(
    `You're invited to stay at ${invite.propertyName}`
  )}&body=${encodeURIComponent(inviteShareBody(invite))}`;
}

function inviteSmsHref(invite: ActionQueueInvite): string {
  return `sms:?&body=${encodeURIComponent(inviteShareBody(invite))}`;
}

function alertTitle(item: StackItem): string {
  const first = firstName(item.guestName);
  if (item.kind === 'visit') {
    return `${first} asked to visit ${dateRangeLabel(
      item.checkIn,
      item.checkOut
    )}.`;
  }
  return `${first} hasn’t confirmed their visit yet.`;
}

function actionHint(item: StackItem): string {
  if (item.kind === 'visit') {
    return 'Approve the visit to confirm it, or decline the request.';
  }
  return 'Send them a personal note with a link to their invite, then mark it done.';
}


export function DashboardNeedsYou({
  requestedVisits,
  pendingInvitations,
}: {
  requestedVisits: ActionQueueVisit[];
  pendingInvitations: ActionQueueInvite[];
}) {
  const router = useRouter();

  const items = useMemo<StackItem[]>(
    () => [
      ...requestedVisits.map((v) => ({ kind: 'visit' as const, ...v })),
      ...pendingInvitations.map((i) => ({ kind: 'invite' as const, ...i })),
    ],
    [requestedVisits, pendingInvitations]
  );

  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [exitingId, setExitingId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  const total = items.length;
  const remaining = items.filter((it) => !dismissed.has(it.id));
  const safeIndex = remaining.length
    ? Math.min(index, remaining.length - 1)
    : 0;

  const goPrev = () => setIndex(Math.max(0, safeIndex - 1));
  const goNext = () => setIndex(Math.min(remaining.length - 1, safeIndex + 1));

  function dismiss(id: string) {
    if (exitingId) return;
    setExitingId(id);
    setTimeout(() => {
      setDismissed((prev) => new Set(prev).add(id));
      setExitingId(null);
    }, EXIT_MS);
  }

  async function handleAction(id: string, action: 'approve' | 'decline') {
    setLoadingId(id);
    const res = await fetch(`/api/visits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setLoadingId(null);
    if (!res.ok) {
      toast.error('Action failed');
      return;
    }
    toast.success(action === 'approve' ? 'Visit approved' : 'Visit declined');
    dismiss(id);
    router.refresh();
  }

  async function copyLink(token: string) {
    try {
      await navigator.clipboard.writeText(getInviteUrl(token));
      toast.success('Invite link copied');
    } catch {
      toast.error('Could not copy link');
    }
  }

  if (total === 0 || remaining.length === 0) {
    return (
      <section>
        <CaughtUp cleared={total > 0} />
      </section>
    );
  }

  return (
    <section>
      <CardStack
        remaining={remaining}
        index={safeIndex}
        exitingId={exitingId}
        loadingId={loadingId}
        onPrev={goPrev}
        onNext={goNext}
        onDismiss={dismiss}
        onAction={handleAction}
        onCopy={copyLink}
      />
    </section>
  );
}

function CaughtUp({ cleared }: { cleared: boolean }) {
  return (
    <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-2xl border bg-card px-6 py-12 text-center shadow-sm">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
        <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-500" />
      </div>
      <div>
        <p className="font-medium">
          {cleared ? 'Nicely done — that’s everyone.' : 'You’re all caught up.'}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          No visits or invitations need your attention right now.
        </p>
      </div>
    </div>
  );
}

interface CardActions {
  remaining: StackItem[];
  loadingId: string | null;
  onDismiss: (id: string) => void;
  onAction: (id: string, action: 'approve' | 'decline') => void;
  onCopy: (token: string) => void;
}

function CardStack({
  remaining,
  index,
  exitingId,
  loadingId,
  onPrev,
  onNext,
  onDismiss,
  onAction,
  onCopy,
}: CardActions & {
  exitingId: string | null;
  index: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const [reachedOut, setReachedOut] = useState<Set<string>>(new Set());
  const markReached = (id: string) =>
    setReachedOut((prev) => new Set(prev).add(id));
  const undoReached = (id: string) =>
    setReachedOut((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const current = remaining[index];
  const visible = remaining.slice(index, index + MAX_BEHIND + 1);
  const position = index + 1;
  const isVisit = current.kind === 'visit';
  const mailHref = current.kind === 'invite' ? inviteMailHref(current) : null;
  const smsHref = current.kind === 'invite' ? inviteSmsHref(current) : null;
  const hasReachedOut = reachedOut.has(current.id);

  return (
    <div className="mt-5 border-y py-8">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
        {/* Explanatory copy + actions */}
        <div className="order-2 lg:order-1">
          <p className="text-sm font-medium tabular-nums text-muted-foreground">
            {position} / {remaining.length}
          </p>
          <h3 className="mt-3 text-2xl font-semibold leading-tight">
            {alertTitle(current)}
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {actionHint(current)}
          </p>

          {isVisit ? (
            <div className="mt-6 flex flex-wrap gap-2">
              <Button
                disabled={loadingId === current.id}
                onClick={() => onAction(current.id, 'approve')}
              >
                <Check className="mr-1 h-4 w-4" />
                Approve visit
              </Button>
              <Button
                variant="outline"
                disabled={loadingId === current.id}
                onClick={() => onAction(current.id, 'decline')}
              >
                Decline
              </Button>
            </div>
          ) : hasReachedOut ? (
            <div className="mt-6">
              <Button onClick={() => onDismiss(current.id)}>
                Next task
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <button
                type="button"
                onClick={() => undoReached(current.id)}
                className="mt-3 block text-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Return
              </button>
            </div>
          ) : (
            <div className="mt-6 flex flex-wrap gap-2">
              {mailHref && (
                <Button
                  asChild
                  variant="outline"
                  onClick={() => markReached(current.id)}
                >
                  <a href={mailHref}>
                    <Mail className="mr-1 h-4 w-4" />
                    Email
                  </a>
                </Button>
              )}
              {smsHref && (
                <Button
                  asChild
                  variant="outline"
                  onClick={() => markReached(current.id)}
                >
                  <a href={smsHref}>
                    <MessageSquareText className="mr-1 h-4 w-4" />
                    Text
                  </a>
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  onCopy(current.token);
                  markReached(current.id);
                }}
              >
                <Link2 className="mr-1 h-4 w-4" />
                Copy link
              </Button>
            </div>
          )}
        </div>

        {/* Right-aligned deck with chevron navigation on either side */}
        <div className="order-1 lg:order-2 lg:justify-self-end">
          <div className="flex items-center gap-2 sm:gap-3">
            <StackChevron
              dir="prev"
              onClick={onPrev}
              disabled={index === 0}
            />
            <div className="relative w-full max-w-md sm:w-[26rem]">
              {/* Cards behind: absolutely filling the active card's height. */}
              {visible
                .slice(1)
                .map((item, i) => ({ item, depth: i + 1 }))
                .reverse()
                .map(({ item, depth }) => (
                  <div
                    key={item.id}
                    aria-hidden
                    className="pointer-events-none absolute inset-0 transition-all duration-300 ease-out"
                    style={{
                      zIndex: 30 - depth,
                      transform: `translateY(${depth * 12}px) scale(${
                        1 - depth * 0.05
                      }) rotate(${depth % 2 === 0 ? -2.5 : 2.5}deg)`,
                    }}
                  >
                    <div className="h-full rounded-2xl border bg-card shadow-sm" />
                  </div>
                ))}
              {/* Active card: in flow, so the stack grows to fit its content. */}
              <div
                className="relative transition-all duration-300 ease-out"
                style={{
                  zIndex: 30,
                  transform:
                    current.id === exitingId
                      ? 'translateX(120%) rotate(10deg)'
                      : 'none',
                  opacity: current.id === exitingId ? 0 : 1,
                }}
              >
                <DeckCard item={current} onDismiss={onDismiss} />
              </div>
            </div>
            <StackChevron
              dir="next"
              onClick={onNext}
              disabled={index >= remaining.length - 1}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DeckCard({
  item,
  onDismiss,
}: {
  item: StackItem;
  onDismiss: (id: string) => void;
}) {
  const isVisit = item.kind === 'visit';
  const checkIn = item.checkIn || null;
  const checkOut = item.checkOut || null;
  const guestsLabel = isVisit
    ? `${item.partySize} ${item.partySize === 1 ? 'guest' : 'guests'}`
    : item.maxGuests
      ? `Up to ${item.maxGuests} ${item.maxGuests === 1 ? 'guest' : 'guests'}`
      : '—';

  return (
    <div className="flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <PersonAvatar
            name={item.guestName}
            imageUrl={isVisit ? item.avatarUrl : null}
            seed={item.email ?? (isVisit ? item.id : item.token)}
            size="md"
          />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold">{item.guestName}</p>
            {isVisit ? (
              <Badge className="mt-1 bg-warning/20 text-warning-foreground hover:bg-warning/20">
                Wants to visit
              </Badge>
            ) : (
              <Badge variant="outline" className="mt-1">
                Awaiting reply
              </Badge>
            )}
          </div>
        </div>
        <button
          type="button"
          aria-label="Dismiss for now"
          onClick={() => onDismiss(item.id)}
          className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Booking idiom box: dates + guests, matching the rest of the site. */}
      <div className="mt-4 overflow-hidden rounded-xl border">
        <div className="grid grid-cols-2 divide-x">
          <div className="p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Check-in
            </p>
            <p className="mt-0.5 text-sm">{formatBox(checkIn)}</p>
          </div>
          <div className="p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Checkout
            </p>
            <p className="mt-0.5 text-sm">{formatBox(checkOut)}</p>
          </div>
        </div>
        <div className="border-t p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Guests
          </p>
          <p className="mt-0.5 text-sm">{guestsLabel}</p>
        </div>
      </div>

      {/* Secondary details — lighter, not boxed. */}
      <dl className="mt-4 space-y-2">
        <MetaRow
          label={item.rooms.length > 1 ? 'Rooms' : 'Room'}
          value={item.rooms.length ? item.rooms.join(', ') : 'Whole home'}
        />
        <MetaRow label="House" value={item.propertyName} />
        {item.kind === 'invite' && (
          <>
            <MetaRow
              label="Type"
              value={INVITATION_TYPE_LABELS[item.inviteType]}
            />
            <MetaRow label="Invite sent" value={formatDay(item.sentAt)} />
            {item.expiresAt && (
              <MetaRow label="Expires" value={formatDay(item.expiresAt)} />
            )}
          </>
        )}
        {item.email && <MetaRow label="Guest" value={item.email} />}
      </dl>
    </div>
  );
}

function StackChevron({
  dir,
  onClick,
  disabled,
}: {
  dir: 'prev' | 'next';
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={dir === 'prev' ? 'Previous' : 'Next'}
      onClick={onClick}
      disabled={disabled}
      className="z-40 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
    >
      {dir === 'prev' ? (
        <ChevronLeft className="h-5 w-5" />
      ) : (
        <ChevronRight className="h-5 w-5" />
      )}
    </button>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="min-w-0 truncate text-right text-sm text-muted-foreground">
        {value}
      </dd>
    </div>
  );
}

