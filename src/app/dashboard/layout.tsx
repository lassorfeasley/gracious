import { requireOwner } from '@/lib/auth';
import { PendingUpgradeCheckout } from '@/components/dashboard/pending-upgrade-checkout';

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwner();
  return (
    <>
      <PendingUpgradeCheckout />
      {children}
    </>
  );
}
