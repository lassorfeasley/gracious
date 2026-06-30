import { requireAuth, getOwnerProperties } from '@/lib/auth';
import { isSiteAdmin } from '@/lib/site-admin';
import { getAccountUsage } from '@/lib/billing';
import { DashboardTopNav } from '@/components/dashboard/top-nav';
import { SiteFooter } from '@/components/site-footer';
import { DashboardContainer } from '@/components/dashboard/dashboard-container';
import { AccountSettingsForm } from '@/components/dashboard/account-settings-form';
import { SubscriptionCard } from '@/components/dashboard/subscription-card';

export const metadata = { title: 'Settings' };

export default async function AccountSettingsPage() {
  const user = await requireAuth();
  const properties = await getOwnerProperties(user.id);
  const isHost = properties.length > 0;
  const usage = isHost ? await getAccountUsage(user.id) : null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <DashboardTopNav
        properties={properties}
        userEmail={user.email ?? undefined}
        userId={user.id}
        showAdminLink={isSiteAdmin(user)}
      />
      <main className="flex-1 px-6 pt-6 pb-32">
        <DashboardContainer width="form">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your account, notifications, and billing.
            </p>
          </div>

          <div className="mt-4 divide-y">
            {usage && (
              <SubscriptionCard
                currentPlan={usage.plan}
                invitationsUsed={usage.used}
                invitationsLimit={usage.limit}
                returnPath="/dashboard/settings"
              />
            )}

            <AccountSettingsForm user={user} isHost={isHost} />
          </div>
        </DashboardContainer>
      </main>
      <SiteFooter />
    </div>
  );
}
