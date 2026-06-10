import Link from 'next/link';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function PricingCards({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto max-w-3xl', className)}>
      <div className="rounded-3xl border border-border/60 bg-card p-8 sm:p-10">
        <div className="flex flex-col items-center gap-8 text-center lg:flex-row lg:items-stretch lg:gap-10 lg:text-left">
          <div className="flex-1 lg:flex lg:flex-col lg:justify-center">
            <h3 className="font-display text-2xl font-medium tracking-tight">
              Your first two stays are on the house
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              No card to begin. Make the house ready and welcome your first
              guests.
            </p>
          </div>

          <div className="flex w-full items-center gap-3 lg:w-auto lg:flex-col">
            <span className="h-px flex-1 bg-border lg:h-auto lg:w-px" />
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-brass">
              then
            </span>
            <span className="h-px flex-1 bg-border lg:h-auto lg:w-px" />
          </div>

          <div className="flex-1 lg:flex lg:flex-col lg:justify-center">
            <div className="flex items-baseline justify-center gap-1.5 lg:justify-start">
              <span className="font-display text-5xl font-medium tracking-tight">
                $39
              </span>
              <span className="text-base text-muted-foreground">/ month</span>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              or $390 for the year
            </p>

            <Button asChild size="lg" className="mt-5 w-full">
              <Link href="/signup">Get started</Link>
            </Button>

            <Link
              href="/signup?upgrade=pro&interval=annual"
              className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              Or take the year now &rarr;
            </Link>

            <p className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground lg:justify-start">
              <Check className="size-4 shrink-0 text-success" />
              Every stay, every home &middot; Your guests never pay
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
