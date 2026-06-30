import { requireAuth, getOwnerProperties } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SiteFooter } from '@/components/site-footer';
import { Wordmark } from '@/components/brand/wordmark';
import { LogoutButton } from '@/components/logout-button';
import { DashboardHome } from '@/components/dashboard/dashboard-home';
import { getPortfolioData } from '@/lib/portfolio';
import { getHostActionQueue } from '@/lib/dashboard-home';
import { accountCalendarFeedUrl } from '@/lib/calendar-feed';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireAuth();
  const properties = await getOwnerProperties(user.id);

  if (properties.length === 0) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <DashboardRootHeader />
        <main className="container mx-auto w-full max-w-2xl px-4 py-12">
          <h1 className="text-2xl font-semibold">Your homes</h1>
          <div className="mt-8 rounded-xl border bg-card p-6">
            <h2 className="text-lg font-semibold">Add your first home</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up your place with rooms, amenities, and location — same flow
              as getting started.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/dashboard/add-home">Get started</Link>
            </Button>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const [portfolio, queue] = await Promise.all([
    getPortfolioData(properties),
    getHostActionQueue(properties),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardRootHeader />
      <main className="flex-1 px-4 pt-8 pb-32 sm:px-6">
        <DashboardHome
          firstName={user.first_name}
          portfolio={portfolio}
          queue={queue}
          accountFeedUrl={accountCalendarFeedUrl(user.id)}
        />
      </main>
      <SiteFooter />
    </div>
  );
}

function DashboardRootHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/dashboard" aria-label="Gracious home">
          <Wordmark className="h-5 text-primary" />
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
