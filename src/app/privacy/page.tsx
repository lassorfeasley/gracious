import { notFound } from 'next/navigation';
import { SiteFooter } from '@/components/site-footer';
import {
  LegalDocumentView,
  LegalPageShell,
} from '@/components/legal-document-view';
import { getSiteDocument } from '@/lib/site-documents-server';

export const revalidate = 3600;

export const metadata = {
  title: 'Privacy Policy',
  robots: { index: true, follow: true },
};

export default async function PrivacyPage() {
  const document = await getSiteDocument('privacy');
  if (!document) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <LegalPageShell>
        <LegalDocumentView document={document} />
      </LegalPageShell>
      <SiteFooter />
    </div>
  );
}
