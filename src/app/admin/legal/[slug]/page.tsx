import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSiteAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/dates';
import { getSiteDocumentAdmin } from '@/lib/site-documents-server';
import {
  isSiteDocumentSlug,
  SITE_DOCUMENT_LABELS,
  SITE_DOCUMENT_PATHS,
  type SiteDocumentSlug,
} from '@/lib/site-documents';
import { LegalDocumentEditor } from '@/components/admin/legal-document-editor';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isSiteDocumentSlug(slug)) return { title: 'Legal · Admin' };
  return { title: `${SITE_DOCUMENT_LABELS[slug]} · Admin` };
}

export default async function AdminLegalEditPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await requireSiteAdmin();
  const { slug } = await params;
  if (!isSiteDocumentSlug(slug)) notFound();

  const document = await getSiteDocumentAdmin(slug);
  if (!document) notFound();

  const label = SITE_DOCUMENT_LABELS[slug as SiteDocumentSlug];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/legal"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Legal
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Last updated {formatDate(document.updated_at)} ·{' '}
          <Link
            href={SITE_DOCUMENT_PATHS[slug]}
            className="underline underline-offset-4 hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            View public page
          </Link>
        </p>
      </div>

      <LegalDocumentEditor document={document} />
    </div>
  );
}
