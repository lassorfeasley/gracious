import { createClient } from '@/lib/supabase/server';
import { getDashboardProperty } from '@/lib/dashboard-property';
import { getInvitationRoomAvailability } from '@/lib/guest-availability';
import { ComposePageActions } from '@/components/dashboard/compose-page-actions';
import { DashboardContainer } from '@/components/dashboard/dashboard-container';
import { VisitsHub, type VisitTab } from '@/components/dashboard/visits-hub';
import { loadVisitsHubData } from '@/lib/visits-hub-data';

export const metadata = { title: 'Visits' };

const VALID_TABS: VisitTab[] = [
  'all',
  'requested',
  'upcoming',
  'past',
  'cancelled',
  'invited',
];

export default async function VisitsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; notice?: string }>;
}) {
  const { slug } = await params;
  const { status, notice } = await searchParams;
  const property = await getDashboardProperty(slug);
  const today = new Date().toISOString().split('T')[0];

  const supabase = await createClient();

  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('property_id', property.id)
    .order('display_order');

  const { visits, invites } = await loadVisitsHubData([property]);

  const roomAvailability = await getInvitationRoomAvailability(
    (rooms ?? []).map((r) => r.id),
    { includeGuestNames: true }
  );

  const initialTab: VisitTab = VALID_TABS.includes(status as VisitTab)
    ? (status as VisitTab)
    : 'all';

  const noticeMessage =
    notice === 'approved'
      ? { ok: true, text: 'Request approved — the guest has been notified.' }
      : notice === 'declined'
        ? { ok: true, text: 'Request declined — the guest has been notified.' }
        : notice === 'handled'
          ? {
              ok: false,
              text: 'This request has already been handled — see its current status below.',
            }
          : null;

  return (
    <DashboardContainer className="flex flex-col gap-6">
      {noticeMessage && (
        <div
          className={
            noticeMessage.ok
              ? 'rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-200'
              : 'rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
          }
        >
          {noticeMessage.text}
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Visits</h1>
        </div>
        <ComposePageActions
          propertyId={property.id}
          rooms={rooms ?? []}
          roomAvailability={roomAvailability}
        />
      </div>

      {rooms?.length === 0 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          Add rooms before inviting guests or adding manual visits.
        </div>
      )}

      <VisitsHub
        today={today}
        initialTab={initialTab}
        visits={visits}
        invites={invites}
        returnPath={`/dashboard/${slug}/visits`}
      />
    </DashboardContainer>
  );
}
