'use client';

import { useEffect, useRef, useState } from 'react';
import { KeyRound, MapPin, Wifi } from 'lucide-react';
import { cn } from '@/lib/utils';

/*
 * Guest-experience showcase: a chronological stack of the lifecycle emails a
 * guest receives — invitation → arrival → afterward. The top "sheet" slides off
 * to the right to reveal the next note beneath it, loose-leaf style. Auto-cycles
 * once in view; the breadcrumb below doubles as a chronology indicator and
 * manual control. Hardcoded fictional data — a lookalike, never live mail.
 */

const ARRIVAL_DETAILS = [
  {
    icon: MapPin,
    label: 'Directions',
    value: '14 Shoreline Lane — last house on the left',
  },
  { icon: KeyRound, label: 'Door code', value: '4 7 2 9 ✱' },
  { icon: Wifi, label: 'Wi-Fi', value: 'LakeHouse · guest' },
];

interface Email {
  id: string;
  crumb: string;
  time: string;
  subject: string;
  body: string;
  block: React.ReactNode;
  note: string;
}

const EMAILS: Email[] = [
  {
    id: 'invite',
    crumb: 'Invitation',
    time: '3 weeks before',
    subject: 'Margaret has invited you to The Lake House',
    body: "You're invited to stay. Take a look at the house and pick the dates that suit you.",
    block: (
      <div className="flex flex-col items-center rounded-xl bg-primary px-6 py-5 text-center">
        <span className="h-0.5 w-8 bg-brass" />
        <span className="mt-2.5 font-display text-lg text-primary-foreground">
          The Lake House
        </span>
        <span className="mt-3 rounded-md bg-primary-foreground/10 px-3 py-1 text-xs font-medium text-primary-foreground">
          View house &amp; request stay
        </span>
      </div>
    ),
    note: '“The water is warmest in late June — come for a long weekend.”',
  },
  {
    id: 'arrival',
    crumb: 'Get ready',
    time: 'The morning of',
    subject: 'Get ready for your visit — see you Friday',
    body: "Hi Theo, everything you need is right here. We can't wait to have you.",
    block: (
      <div className="divide-y divide-border/60 rounded-xl bg-background/70">
        {ARRIVAL_DETAILS.map((detail) => (
          <div key={detail.label} className="flex items-center gap-3 px-4 py-3">
            <detail.icon className="size-4 shrink-0 text-brass" />
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {detail.label}
              </p>
              <p className="truncate text-sm font-medium">{detail.value}</p>
            </div>
          </div>
        ))}
      </div>
    ),
    note: '“The kettle’s on the stove and the spare key is under the blue planter.”',
  },
  {
    id: 'after',
    crumb: 'Afterward',
    time: 'Checkout morning',
    subject: 'We hope you had a great time',
    body: 'Safe travels, Theo. Just leave the key on the hook — and come back soon.',
    block: (
      <div className="flex flex-col items-center rounded-xl bg-background/70 px-6 py-5 text-center">
        <span className="text-sm text-muted-foreground">
          Your room will be here whenever you are.
        </span>
        <span className="mt-3 rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          Plan another visit
        </span>
      </div>
    ),
    note: '“It was so lovely having you. The door is always open.” — Margaret',
  },
];

const N = EMAILS.length;
const SLIDE_MS = 560;
const HOLD_MS = 3600;

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

function EmailCard({ email }: { email: Email }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xl">
      <div className="border-b border-border/60 px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm text-primary-foreground">
            G
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-medium">Gracious</p>
              <p className="shrink-0 text-[11px] text-muted-foreground">
                {email.time}
              </p>
            </div>
            <p className="truncate text-xs text-muted-foreground">
              to Theo &middot; on behalf of Margaret
            </p>
          </div>
        </div>
        <p className="mt-3 font-display text-lg leading-snug tracking-tight">
          {email.subject}
        </p>
      </div>
      <div className="flex flex-1 flex-col px-5 py-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {email.body}
        </p>
        <div className="mt-4">{email.block}</div>
        <p className="mt-auto pt-4 text-sm italic leading-relaxed text-muted-foreground">
          {email.note}
        </p>
      </div>
    </div>
  );
}

export function GuestExperience({ className }: { className?: string }) {
  const [order, setOrder] = useState(() => EMAILS.map((_, i) => i));
  const [exiting, setExiting] = useState(false);
  const [instantId, setInstantId] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [userControlled, setUserControlled] = useState(false);
  const [inView, setInView] = useState(false);
  const reduced = usePrefersReducedMotion();

  const orderRef = useRef(order);
  const animatingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  const front = order[0];
  const auto = inView && !paused && !userControlled && !reduced;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.35 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Slide the current top sheet off to the right, then re-stack with `target`
  // on top. The departing card is repositioned to the back without a transition
  // (so it doesn't visibly slide back in) and fades into place.
  function advanceTo(target: number) {
    if (animatingRef.current) return;
    const curr = orderRef.current;
    if (target === curr[0]) return;
    animatingRef.current = true;
    setExiting(true);
    window.setTimeout(() => {
      const departing = curr[0];
      const next = Array.from({ length: N }, (_, k) => (target + k) % N);
      setInstantId(departing);
      setOrder(next);
      setExiting(false);
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          setInstantId(null);
          animatingRef.current = false;
        })
      );
    }, SLIDE_MS);
  }

  useEffect(() => {
    if (!auto) return;
    const timer = window.setInterval(() => {
      const curr = orderRef.current;
      advanceTo((curr[0] + 1) % N);
    }, HOLD_MS);
    return () => window.clearInterval(timer);
  }, [auto]);

  function handleCrumb(index: number) {
    setUserControlled(true);
    advanceTo(index);
  }

  return (
    <div className={cn('mx-auto max-w-5xl', className)}>
      <div className="lg:grid lg:grid-cols-2 lg:items-center lg:gap-20">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brass">
            For your guests
          </p>
          <h2 className="mt-4 font-display text-3xl font-medium tracking-tight sm:text-4xl">
            Every guest arrives knowing exactly what to do.
          </h2>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
            From the first invitation to the final goodbye, we send the right
            note at the right moment — so no one ever has to ask.
          </p>
        </div>

        <div className="mt-12 lg:mt-0">
          <div
            ref={rootRef}
            className="relative mx-auto h-[400px] w-full max-w-sm"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {EMAILS.map((email, i) => {
              const depth = order.indexOf(i);
              const isFront = depth === 0;
              const isExitingCard = isFront && exiting;
              const isInstant = instantId === i;

              let transform: string;
              let opacity = 1;
              let zIndex = N - depth;

              if (isExitingCard) {
                transform = 'translateX(78vw) rotate(7deg)';
                opacity = 0;
                zIndex = N + 1;
              } else {
                const tx = depth * 9;
                const ty = depth * 16;
                const scale = 1 - depth * 0.045;
                const rot = depth === 0 ? 0 : depth === 1 ? -2.5 : 2.5;
                transform = `translate(${tx}px, ${ty}px) scale(${scale}) rotate(${rot}deg)`;
                if (isInstant) opacity = 0;
              }

              const transition =
                isInstant || reduced
                  ? 'none'
                  : `transform ${SLIDE_MS}ms cubic-bezier(.4,0,.2,1), opacity 340ms ease`;

              return (
                <div
                  key={email.id}
                  aria-hidden={!isFront}
                  className="absolute inset-x-0 top-0 h-full will-change-transform"
                  style={{ transform, opacity, zIndex, transition }}
                >
                  <EmailCard email={email} />
                </div>
              );
            })}
          </div>

          {/* Chronology breadcrumb / manual control */}
          <div className="mt-8 flex items-center justify-center">
            {EMAILS.map((email, i) => {
              const active = i === front;
              return (
                <div key={email.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => handleCrumb(i)}
                    className="group flex items-center gap-2 rounded-full px-1 py-1"
                    aria-current={active ? 'step' : undefined}
                  >
                    <span
                      className={cn(
                        'size-2 rounded-full transition-colors',
                        active
                          ? 'bg-brass'
                          : 'bg-border group-hover:bg-muted-foreground/50'
                      )}
                    />
                    <span
                      className={cn(
                        'text-xs transition-colors',
                        active
                          ? 'font-medium text-foreground'
                          : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    >
                      {email.crumb}
                    </span>
                  </button>
                  {i < N - 1 && (
                    <span className="mx-2 h-px w-6 bg-border" aria-hidden />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
