import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * Static demo artifacts for the landing page scrollytelling section.
 * These are lookalikes of real product surfaces (setup, invitation email,
 * lifecycle correspondence, calendar) built with web design tokens and
 * hardcoded fictional data — never live components, never interactive.
 */

function ArtifactCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-border/60 bg-card shadow-lg',
        className
      )}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Beat 1 — Tell us about your home                                    */
/* ------------------------------------------------------------------ */

const DEMO_ROOMS = [
  { name: 'The Garden Room', detail: 'Queen bed · sleeps 2' },
  { name: 'The Loft', detail: 'Two twins · sleeps 2' },
];

export function HouseReadyArtifact() {
  return (
    <ArtifactCard>
      <div className="border-b border-border/60 px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-brass">
          Your house
        </p>
        <p className="mt-1 font-display text-xl tracking-tight">
          The Lake House
        </p>
      </div>
      <div className="divide-y divide-border/60">
        {DEMO_ROOMS.map((room) => (
          <div key={room.name} className="flex items-center gap-3 px-5 py-3.5">
            <div className="size-9 shrink-0 rounded-lg bg-secondary" />
            <div className="min-w-0">
              <p className="text-sm font-medium">{room.name}</p>
              <p className="text-xs text-muted-foreground">{room.detail}</p>
            </div>
            <Check className="ml-auto size-4 shrink-0 text-success" />
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 bg-background/60 px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          House notes
        </p>
        <p className="mt-1.5 text-sm italic leading-relaxed text-muted-foreground">
          &ldquo;The spare key lives under the blue planter. Help yourself to
          anything in the garden.&rdquo;
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
          Kept for family &middot; Aug 12&ndash;19
        </p>
      </div>
    </ArtifactCard>
  );
}

/* ------------------------------------------------------------------ */
/* Beat 2 — Extend the invitation                                      */
/* ------------------------------------------------------------------ */

export function InvitationArtifact() {
  return (
    <div className="relative overflow-hidden pb-6">
      <ArtifactCard>
        <div className="border-b border-border/60 px-5 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            From Gracious &middot; just now
          </p>
          <p className="mt-1 truncate text-sm font-medium">
            Margaret has invited you to The Lake House
          </p>
        </div>
        <div className="p-5">
          <div className="flex aspect-[1.618/1] flex-col items-center justify-center rounded-lg bg-primary px-6 text-center">
            <span className="h-0.5 w-8 bg-brass" />
            <span className="mt-3 font-display text-xl text-primary-foreground">
              The Lake House
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Hi Theo, <strong className="text-foreground">Margaret</strong> has
            invited you to stay at{' '}
            <strong className="text-foreground">The Lake House</strong>.
          </p>
          <div className="mt-3 rounded-xl bg-background/80 px-4 py-3">
            <p className="text-sm italic leading-relaxed text-muted-foreground">
              &ldquo;The water is warmest in late June. Come for a long
              weekend &mdash; and bring the dog.&rdquo;
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              &mdash; Margaret
            </p>
          </div>
          <div className="mt-4 rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground">
            View house &amp; request stay
          </div>
        </div>
      </ArtifactCard>
      <div className="absolute bottom-0 right-0 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-2 text-[11px] font-medium shadow-md sm:-bottom-4 sm:-right-6 sm:max-w-none sm:px-3.5 sm:text-xs">
        <Check className="size-3.5 text-success" />
        Theo confirmed &middot; June 12&ndash;15
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Beat 3 — We handle the correspondence                               */
/* ------------------------------------------------------------------ */

const DEMO_LETTERS = [
  {
    subject: 'Two weeks until The Lake House',
    snippet: 'A gentle reminder — your stay begins Friday, June 12.',
    className: '-rotate-2',
  },
  {
    subject: 'Welcome — everything for your arrival',
    snippet: 'Directions, the door code, and where to find the kettle.',
    className: 'rotate-1 translate-x-3',
  },
  {
    subject: 'Checkout this morning — safe travels',
    snippet: 'Leave the key on the hook. Margaret says come back soon.',
    className: '-rotate-1 -translate-x-2',
  },
];

export function CorrespondenceArtifact() {
  return (
    <div className="flex flex-col gap-4 py-4">
      {DEMO_LETTERS.map((letter) => (
        <ArtifactCard
          key={letter.subject}
          className={cn('px-5 py-4', letter.className)}
        >
          <div className="flex items-baseline justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Gracious
            </p>
            <p className="text-[11px] text-muted-foreground">
              sent for you
            </p>
          </div>
          <p className="mt-1.5 text-sm font-medium">{letter.subject}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {letter.snippet}
          </p>
        </ArtifactCard>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Beat 4 — Always know who's arriving Friday                          */
/* ------------------------------------------------------------------ */

/* June 2026: the 1st falls on a Monday in a Sunday-first grid. */
const FIRST_WEEKDAY_OFFSET = 1;
const DAYS_IN_MONTH = 30;

const STAYS = [
  { start: 12, end: 15, label: 'Theo & June', dotClass: 'bg-primary' },
  { start: 19, end: 21, label: 'The Munros', dotClass: 'bg-brass' },
];

function dayClass(day: number): string {
  for (const stay of STAYS) {
    if (day >= stay.start && day <= stay.end) {
      const base =
        stay.dotClass === 'bg-primary'
          ? 'bg-primary/10 text-primary font-medium'
          : 'bg-brass/15 text-brass font-medium';
      return cn(
        base,
        day === stay.start && 'rounded-l-md',
        day === stay.end && 'rounded-r-md'
      );
    }
  }
  return 'text-muted-foreground';
}

export function CalendarArtifact() {
  return (
    <ArtifactCard className="p-5">
      <div className="flex items-baseline justify-between">
        <p className="font-display text-lg tracking-tight">June</p>
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Two stays
        </p>
      </div>
      <div className="mt-4 grid grid-cols-7 gap-y-1 text-center text-xs">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span
            key={`${d}-${i}`}
            className="pb-1 text-[10px] font-medium uppercase text-muted-foreground/70"
          >
            {d}
          </span>
        ))}
        {Array.from({ length: FIRST_WEEKDAY_OFFSET }, (_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1).map((day) => (
          <span key={day} className={cn('py-1.5', dayClass(day))}>
            {day}
          </span>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1.5 border-t border-border/60 pt-4">
        {STAYS.map((stay) => (
          <p
            key={stay.label}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <span className={cn('size-2 rounded-full', stay.dotClass)} />
            {stay.label} &middot; June {stay.start}&ndash;{stay.end}
          </p>
        ))}
      </div>
    </ArtifactCard>
  );
}
