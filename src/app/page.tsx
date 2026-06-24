import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getAuthenticatedHomePath, getCurrentUser } from '@/lib/auth';
import { isLandingPreviewEnabled } from '@/lib/dev-tools';
import { redirect } from 'next/navigation';
import { SiteFooter } from '@/components/site-footer';
import { Wordmark } from '@/components/brand/wordmark';
import { HowItWorks } from '@/components/landing/how-it-works';
import { FounderNote } from '@/components/landing/founder-note';
import { GuestExperience } from '@/components/landing/guest-experience';
import { StayShowcase } from '@/components/landing/stay-showcase';
import { PricingCards } from '@/components/pricing-cards';
import { appUrl } from '@/lib/env';

const title = 'Gracious — Every room, every guest, on one calendar';
const description =
  'A warm, private way to have friends and family to stay. See who\u2019s staying across all your homes at a glance, and handle inviting, visiting, and coordinating graciously.';

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,
  alternates: {
    canonical: '/',
  },
  // The landing page is the public face of the product, so it opts back into
  // indexing (the root layout defaults every route to noindex for the app).
  robots: { index: true, follow: true },
  openGraph: {
    title,
    description,
    url: '/',
    type: 'website',
  },
};

function StructuredData() {
  const base = appUrl();
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${base}/#organization`,
        name: 'Gracious',
        url: base,
        description,
      },
      {
        '@type': 'SoftwareApplication',
        name: 'Gracious',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        url: base,
        description,
        publisher: { '@id': `${base}/#organization` },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Your first two visits are free.',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const landingPreview = isLandingPreviewEnabled(preview);

  const user = await getCurrentUser();

  if (!landingPreview && user) {
    redirect(await getAuthenticatedHomePath(user));
  }

  // In landing preview, a signed-in user stays on this page, so point the
  // header at their app home instead of showing sign-in / sign-up.
  const homePath = user ? await getAuthenticatedHomePath(user) : null;

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background">
      <StructuredData />
      <header className="border-b border-border/60">
        <div className="container mx-auto flex h-16 items-center justify-between gap-3 px-4 sm:h-20 sm:px-6">
          <Link href="/" className="min-w-0 shrink" aria-label="Gracious home">
            <Wordmark className="h-5 text-primary sm:h-6" />
          </Link>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {homePath ? (
              <Button size="sm" className="px-3 sm:h-10 sm:px-4 sm:text-base" asChild>
                <Link href={homePath}>Go to dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" size="sm" className="px-3 sm:h-10 sm:px-4 sm:text-base" asChild>
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button size="sm" className="px-3 sm:h-10 sm:px-4 sm:text-base" asChild>
                  <Link href="/signup">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-20 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium tracking-wide text-brass">
            For guest homes and guest rooms
          </p>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
            Every room, every guest, on one calendar.
          </h1>
          <p className="mx-auto mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground">
            See who&apos;s staying across all your homes at a glance. We take care
            of inviting, visiting, and coordinating graciously — so you can be a
            great host while we do the rest.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
        <StayShowcase className="mx-auto mt-16 max-w-4xl sm:mt-20" />
      </main>

      <section
        id="guest-experience"
        className="overflow-hidden border-t border-border/60 py-28"
      >
        <div className="container mx-auto px-4">
          <GuestExperience />
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border/60 py-28">
        <div className="container mx-auto px-4">
          <HowItWorks />
        </div>
      </section>

      <section id="founder-note" className="border-t border-border/60 py-28">
        <div className="container mx-auto px-4">
          <FounderNote />
        </div>
      </section>

      <section id="pricing" className="border-t border-border/60 py-28">
        <div className="container mx-auto px-4">
          <PricingCards />
        </div>
      </section>

      <section className="border-t border-border/60 bg-primary py-24 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            Be the host they remember.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-primary-foreground/80">
            Set up your home in minutes — your first two visits are free.
          </p>
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              className="bg-background text-foreground hover:bg-background/90"
              asChild
            >
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
