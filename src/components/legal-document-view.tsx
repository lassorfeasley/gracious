import Link from 'next/link';
import { formatDate } from '@/lib/dates';
import { LegalDocumentContent } from '@/components/legal-document-content';
import type { SiteDocument } from '@/lib/site-documents';

export function LegalDocumentView({ document }: { document: SiteDocument }) {
  return (
    <article className="space-y-8">
      <header className="space-y-2 border-b pb-6">
        <h1 className="text-3xl font-semibold tracking-tight">
          {document.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated {formatDate(document.updated_at)}
        </p>
      </header>
      <LegalDocumentContent body={document.body} />
    </article>
  );
}

export function LegalPageShell({
  children,
  backHref = '/',
  backLabel = 'Back to Gracious',
}: {
  children: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <>
      <header className="border-b border-border/60">
        <div className="container mx-auto flex h-16 items-center px-4 sm:px-6">
          <Link
            href={backHref}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← {backLabel}
          </Link>
        </div>
      </header>
      <main className="container mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        {children}
      </main>
    </>
  );
}
