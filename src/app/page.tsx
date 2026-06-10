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
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="font-display text-xl tracking-tight">Gracious</span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Open your house</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-28 text-center sm:py-36">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-brass">
          The art of having people to stay
        </p>
        <h1 className="mt-6 font-display text-4xl font-medium tracking-tight sm:text-6xl">
          Run your house the way
          <br />
          a great house is run.
        </h1>
        <p className="mx-auto mt-8 max-w-md text-lg leading-relaxed text-muted-foreground">
          Gracious is the staff you don&apos;t have. A graceful invitation, a
          calendar that already knows the answer, house notes waiting when your
          guests arrive. Never public. Always yours to give.
        </p>
        <div className="mt-12 flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">Open your house</Link>
          </Button>
        </div>
      </main>

      <section id="how-it-works" className="border-t border-border/60 py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-3xl font-medium tracking-tight">
              How the house runs
            </h2>
            <p className="mt-4 text-muted-foreground">
              Three steps from a quiet calendar to friends at the door.
            </p>
          </div>
          <HowItWorksCarousel className="mt-14" />
        </div>
      </section>

      <section id="pricing" className="border-t border-border/60 py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="font-display text-3xl font-medium tracking-tight">
              A hospitality habit
            </h2>
            <p className="mt-4 text-muted-foreground">
              Have your first two stays on the house. Carry on when it feels
              like yours.
            </p>
          </div>
          <PricingCards className="mt-14" />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
