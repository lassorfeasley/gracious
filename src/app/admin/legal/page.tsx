import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireSiteAdmin } from '@/lib/auth';
import { formatDate } from '@/lib/dates';
import { listSiteDocuments, getSiteDocumentAdmin } from '@/lib/site-documents-server';
import {
  SITE_DOCUMENT_PATHS,
  type SiteDocumentSlug,
} from '@/lib/site-documents';
import { LegalDocumentEditor } from '@/components/admin/legal-document-editor';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

export const metadata = { title: 'Legal · Admin' };

export default async function AdminLegalPage() {
  await requireSiteAdmin();
  const documents = await listSiteDocuments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Legal</h1>
        <p className="mt-1 text-muted-foreground">
          Terms of Service and Privacy Policy shown in the site footer.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Document</th>
              <th className="px-4 py-3 font-medium">Last updated</th>
              <th className="px-4 py-3 font-medium">Public page</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.slug} className="border-b last:border-0">
                <td className="px-4 py-3 font-medium">{doc.title}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDate(doc.updated_at)}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={SITE_DOCUMENT_PATHS[doc.slug as SiteDocumentSlug]}
                    className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View live
                  </Link>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/legal/${doc.slug}`}>
                      Edit
                      <ChevronRight className="ml-1 size-4" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
