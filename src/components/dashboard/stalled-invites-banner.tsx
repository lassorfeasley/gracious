'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Send } from 'lucide-react';

interface StalledInvitesBannerProps {
  slug: string;
  stalledCount: number;
}

export function StalledInvitesBanner({
  slug,
  stalledCount,
}: StalledInvitesBannerProps) {
  const pathname = usePathname();
  const visitsHref = `/dashboard/${slug}/visits`;
  const invitedHref = `${visitsHref}?status=invited`;

  // Nothing waiting, or already on the visits hub (where the links live).
  if (stalledCount < 1 || pathname.startsWith(visitsHref)) return null;

  const isPlural = stalledCount > 1;

  return (
    <div className="border-b border-border bg-muted/40">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Send className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">
            {stalledCount} invited {isPlural ? 'guests haven’t' : 'guest hasn’t'}{' '}
            responded yet
          </p>
          <p className="text-sm text-muted-foreground">
            Email can get buried — try texting or messaging{' '}
            {isPlural ? 'them' : 'them'} the link directly.
          </p>
        </div>
        <Link
          href={invitedHref}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all duration-150 hover:bg-muted active:scale-[0.98]"
        >
          {isPlural ? 'Get the links' : 'Get the link'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
