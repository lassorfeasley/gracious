'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { parseISO, format, differenceInCalendarDays } from 'date-fns';
import { ChevronUp } from 'lucide-react';
import { useVisit } from '@/components/guest/visit-context';
import { BareCardProvider } from '@/components/card-chrome';

/**
 * Mobile-only call-to-action docked to the bottom of the screen (hidden on
 * `lg`+, where the in-flow sidebar is used). It defaults to a compact bar — a
 * short summary plus the primary CTA — so the rest of the page stays visible,
 * and expands in place to reveal the full card (date picker, magic-link form,
 * etc.) when tapped.
 */
export function MobileDockedCard({
  ctaLabel,
  idleTitle,
  idleSubtitle,
  trackDates = false,
  children,
}: {
  /** Primary button text shown on the collapsed bar. */
  ctaLabel: string;
  /** Bar title when no dates are selected (or `trackDates` is off). */
  idleTitle: string;
  /** Bar subtitle when no dates are selected (or `trackDates` is off). */
  idleSubtitle: string;
  /** When true, the collapsed bar reflects the selected dates/guests. */
  trackDates?: boolean;
  /** The full card, revealed when the bar is expanded. */
  children: ReactNode;
}) {
  const { checkIn, checkOut, guests } = useVisit();
  const [expanded, setExpanded] = useState(false);
  const collapsedRef = useRef<HTMLDivElement>(null);

  const nights =
    checkIn && checkOut
      ? differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn))
      : 0;
  const hasDates = trackDates && nights > 0 && !!checkIn && !!checkOut;

  const title = hasDates
    ? `${nights} ${nights === 1 ? 'night' : 'nights'}`
    : idleTitle;
  const subtitle = hasDates
    ? `${format(parseISO(checkIn!), 'MMM d')} – ${format(
        parseISO(checkOut!),
        'MMM d'
      )} · ${guests} ${guests === 1 ? 'guest' : 'guests'}`
    : idleSubtitle;

  // Reserve body space equal to the *collapsed* bar so page content and the
  // footer are never hidden behind it. The expanded panel overlays content
  // temporarily, so we don't grow the padding when expanded.
  useEffect(() => {
    if (expanded) return;
    const el = collapsedRef.current;
    if (!el) return;
    const mq = window.matchMedia('(max-width: 1023px)');
    const apply = () => {
      document.body.style.paddingBottom = mq.matches
        ? `${el.offsetHeight}px`
        : '';
    };
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    mq.addEventListener('change', apply);
    apply();
    return () => {
      ro.disconnect();
      mq.removeEventListener('change', apply);
    };
  }, [expanded]);

  useEffect(
    () => () => {
      document.body.style.paddingBottom = '';
    },
    []
  );

  return (
    <div className="lg:hidden">
      {expanded && (
        <button
          type="button"
          aria-label="Collapse"
          tabIndex={-1}
          onClick={() => setExpanded(false)}
          className="fixed inset-0 z-40 cursor-default bg-foreground/10"
        />
      )}
      <div className="fixed inset-x-0 bottom-0 z-50">
        {expanded ? (
          <div className="max-h-[85vh] overflow-y-auto rounded-t-2xl border-t bg-background pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-[0_-12px_32px_rgba(0,0,0,0.18)]">
            <div className="sticky top-0 flex justify-center pt-2.5 pb-1">
              <button
                type="button"
                aria-label="Collapse"
                onClick={() => setExpanded(false)}
                className="h-1.5 w-10 rounded-full bg-muted-foreground/30"
              />
            </div>
            <div className="mx-auto w-full max-w-md">
              <BareCardProvider>{children}</BareCardProvider>
            </div>
          </div>
        ) : (
          <div
            ref={collapsedRef}
            className="border-t bg-background/90 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_rgba(0,0,0,0.1)] backdrop-blur-md"
          >
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold">
                  {title}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {subtitle}
                </span>
              </span>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground">
                {ctaLabel}
                <ChevronUp className="h-4 w-4" />
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
