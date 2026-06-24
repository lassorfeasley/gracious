import type { MetadataRoute } from 'next';
import { appUrl } from '@/lib/env';

export default function robots(): MetadataRoute.Robots {
  const base = appUrl();

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Keep the gated app, internal tooling, and API surface out of crawlers.
      disallow: [
        '/dashboard',
        '/admin',
        '/invite',
        '/my-visits',
        '/unsubscribe',
        '/styleguide',
        '/api',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
