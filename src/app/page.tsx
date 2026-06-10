import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { isSiteAdmin } from '@/lib/site-admin';
import { isLandingPreviewEnabled } from '@/lib/dev-tools';
import { redirect } from 'next/navigation';
import { SiteFooter } from '@/components/site-footer';
import { HowItWorksCarousel } from '@/components/how-it-works-carousel';
import { PricingCards } from '@/components/pricing-cards';

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const { preview } = await searchParams;
  const landingPreview = isLandingPreviewEnabled(preview);

  const user = await getCurrentUser();

  if (!landingPreview) {
    if (user && isSiteAdmin(user)) redirect('/admin');
    if (user?.role === 'owner') redirect('/dashboard');
    if (user) redirect('/my-trips');
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/60">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <span className="font-display text-2xl tracking-tight sm:text-3xl">
            Gracious
          </span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="lg" className="text-base" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="lg" className="text-base" asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-28 text-center sm:py-36">
        <p className="text-sm font-medium tracking-wide text-brass">
          For guest homes and guest rooms
        </p>
        <h1 className="mt-6 font-display text-4xl font-medium tracking-tight sm:text-6xl">
          The gracious way to invite house guests.
        </h1>
        <p className="mx-auto mt-8 max-w-md text-lg leading-relaxed text-muted-foreground">
          We take care of inviting, booking, coordinating, directions &amp;
          conflicts graciously. Be a great host while we do the rest.
        </p>
        <div className="mt-12 flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </main>

      <section id="how-it-works" className="border-t border-border/60 py-28">
        <div className="container mx-auto px-4">
          <HowItWorksCarousel />
        </div>
      </section>

      <section id="pricing" className="border-t border-border/60 py-28">
        <div className="container mx-auto px-4">
          <PricingCards />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
