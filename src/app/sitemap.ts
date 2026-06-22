import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/env';
import { SITE_DOCUMENT_PATHS } from '@/lib/site-documents';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = appUrl();
  const now = new Date();

  return [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${base}${SITE_DOCUMENT_PATHS.terms}`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${base}${SITE_DOCUMENT_PATHS.privacy}`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}
