import { requireAuth, getOwnerProperties } from '@/lib/auth';
import { isSiteAdmin } from '@/lib/site-admin';
import { DashboardTopNav } from '@/components/dashboard/top-nav';
import { SiteFooter } from '@/components/site-footer';
import { DashboardContainer } from '@/components/dashboard/dashboard-container';
import { VisitsHub, type VisitTab } from '@/components/dashboard/visits-hub';
import { loadVisitsHubData } from '@/lib/visits-hub-data';
import { getPortfolioData } from '@/lib/portfolio';
import {
  DashboardInviteAction,
  type InviteHouse,
} from '@/components/dashboard/dashboard-invite-action';

export const metadata = { title: 'Visits' };

const VALID_TABS: VisitTab[] = [
  'all',
  'requested',
  'upcoming',
  'past',
  'cancelled',
  'invited',
];

export default async function AccountVisitsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const user = await requireAuth();
  const properties = await getOwnerProperties(user.id);
  const today = new Date().toISOString().split('T')[0];

  const [{ visits, invites }, portfolio] = await Promise.all([
    loadVisitsHubData(properties),
    properties.length > 0 ? getPortfolioData(properties) : Promise.resolve(null),
  ]);

  const inviteHouses: InviteHouse[] =
    portfolio?.houses.map((h) => ({
      id: h.property.id,
      name: h.property.name,
      rooms: h.rooms,
      roomAvailability: h.roomAvailability,
    })) ?? [];
  const houses = properties.map((p) => ({ slug: p.slug, name: p.name }));

  const initialTab: VisitTab = VALID_TABS.includes(status as VisitTab)
    ? (status as VisitTab)
    : 'all';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardTopNav
        properties={properties}
        userEmail={user.email ?? undefined}
        userId={user.id}
        showAdminLink={isSiteAdmin(user)}
      />
      <main className="flex-1 px-6 pt-6 pb-32">
        <DashboardContainer className="flex flex-col gap-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight">Visits</h1>
            <DashboardInviteAction houses={inviteHouses} />
          </div>

          {properties.length === 0 ? (
            <div className="rounded-2xl border bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground">
              Add a home to start inviting guests and tracking visits.
            </div>
          ) : (
            <VisitsHub
              today={today}
              initialTab={initialTab}
              visits={visits}
              invites={invites}
              houses={houses}
              returnPath="/dashboard/visits"
            />
          )}
        </DashboardContainer>
      </main>
      <SiteFooter />
    </div>
  );
}
