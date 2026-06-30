import Link from 'next/link';
import { SITE_DOCUMENT_PATHS } from '@/lib/site-documents';

export function LegalFooterLinks({ year }: { year: number }) {
  return (
    <nav
      aria-label="Legal"
      className="flex flex-col items-start gap-2 text-sm text-muted-foreground"
    >
      <Link
        href={SITE_DOCUMENT_PATHS.terms}
        className="transition-colors hover:text-foreground hover:underline underline-offset-4"
      >
        Terms of Service
      </Link>
      <Link
        href={SITE_DOCUMENT_PATHS.privacy}
        className="transition-colors hover:text-foreground hover:underline underline-offset-4"
      >
        Privacy Policy
      </Link>
      <p>
        © {year} Gracious ·{' '}
        <a
          href="/llms.txt"
          className="transition-colors hover:text-foreground hover:underline underline-offset-4"
        >
          llms.txt
        </a>
      </p>
    </nav>
  );
}
