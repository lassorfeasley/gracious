import { notFound } from 'next/navigation';
import { requireOwner, getOwnerProperties } from '@/lib/auth';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { MobileNav } from '@/components/dashboard/mobile-nav';

export default async function PropertyDashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await requireOwner();
  const properties = await getOwnerProperties(user.id);
  const currentProperty = properties.find((p) => p.slug === slug);

  if (!currentProperty) notFound();

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar properties={properties} currentProperty={currentProperty} />
      <div className="flex flex-1 flex-col">
        <MobileNav properties={properties} currentProperty={currentProperty} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
