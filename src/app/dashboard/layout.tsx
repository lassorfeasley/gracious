import { requireAuth } from '@/lib/auth';
import { PendingUpgradeCheckout } from '@/components/dashboard/pending-upgrade-checkout';

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth();
  return (
    <>
      <PendingUpgradeCheckout />
      {children}
    </>
  );
}
