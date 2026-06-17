import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  isSiteDocumentSlug,
  type SiteDocument,
  type SiteDocumentSlug,
} from '@/lib/site-documents';

export const getSiteDocument = cache(async function getSiteDocument(
  slug: SiteDocumentSlug
): Promise<SiteDocument | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('site_documents')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as SiteDocument;
});

export async function listSiteDocuments(): Promise<SiteDocument[]> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('site_documents')
    .select('*')
    .order('slug');

  if (error) throw new Error(error.message);
  return (data ?? []) as SiteDocument[];
}

export async function getSiteDocumentAdmin(
  slug: string
): Promise<SiteDocument | null> {
  if (!isSiteDocumentSlug(slug)) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('site_documents')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as SiteDocument;
}
