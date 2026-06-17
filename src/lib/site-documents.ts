export type SiteDocumentSlug = 'terms' | 'privacy';

export const SITE_DOCUMENT_SLUGS: SiteDocumentSlug[] = ['terms', 'privacy'];

export const SITE_DOCUMENT_LABELS: Record<SiteDocumentSlug, string> = {
  terms: 'Terms of Service',
  privacy: 'Privacy Policy',
};

export const SITE_DOCUMENT_PATHS: Record<SiteDocumentSlug, string> = {
  terms: '/terms',
  privacy: '/privacy',
};

export interface SiteDocument {
  slug: SiteDocumentSlug;
  title: string;
  body: string;
  updated_at: string;
  updated_by: string | null;
}

export function isSiteDocumentSlug(slug: string): slug is SiteDocumentSlug {
  return SITE_DOCUMENT_SLUGS.includes(slug as SiteDocumentSlug);
}
