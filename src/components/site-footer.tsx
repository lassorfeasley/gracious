import Link from 'next/link';

import { Wordmark } from '@/components/brand/wordmark';
import { LegalFooterLinks } from '@/components/legal-footer-links';

export function SiteFooter({ name }: { name?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-0.5">
          {name ? (
            <>
              <p className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                {name}
              </p>
              <Link
                href="/"
                className="w-fit text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Graciously hosted
              </Link>
            </>
          ) : (
            <Wordmark className="h-5 text-primary" />
          )}
        </div>

        <LegalFooterLinks year={year} />
      </div>
    </footer>
  );
}
