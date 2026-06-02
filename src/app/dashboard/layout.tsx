import { requireOwner } from '@/lib/auth';

export default async function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireOwner();
  return <>{children}</>;
}
