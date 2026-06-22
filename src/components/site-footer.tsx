import Link from 'next/link';

import { Wordmark } from '@/components/brand/wordmark';
import { LegalFooterLinks } from '@/components/legal-footer-links';

export function SiteFooter({ name }: { name?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex min-h-[200px] max-w-6xl flex-col justify-center gap-4 px-6 py-8">
        {name ? (
          <p className="font-display text-lg tracking-tight">{name}</p>
        ) : (
          <Wordmark className="h-5 text-primary" />
        )}
        {name && (
          <Link
            href="/"
            className="w-fit text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Graciously hosted
          </Link>
        )}
        <LegalFooterLinks />
        <p className="text-xs text-muted-foreground">
          © {year} Gracious ·{' '}
          <a
            href="/llms.txt"
            className="transition-colors hover:text-foreground hover:underline underline-offset-4"
          >
            llms.txt
          </a>
        </p>
      </div>
    </footer>
  );
}
