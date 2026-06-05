import { notFound } from 'next/navigation';
import { requireOwner, getOwnerProperties } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardTopNav } from '@/components/dashboard/top-nav';
import { SiteFooter } from '@/components/site-footer';

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

  const supabase = await createClient();
  const { count: requestCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', currentProperty.id)
    .eq('status', 'requested');

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardTopNav
        properties={properties}
        currentProperty={currentProperty}
        requestCount={requestCount ?? 0}
        userEmail={user.email ?? undefined}
      />
      <main className="flex-1 px-6 pt-6 pb-32">{children}</main>
      <SiteFooter name={currentProperty.name} />
    </div>
  );
}
