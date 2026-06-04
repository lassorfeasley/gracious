import { notFound } from 'next/navigation';
import { requireOwner, getOwnerProperties } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { DashboardTopNav } from '@/components/dashboard/top-nav';

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
      />
      <main className="flex-1 px-6 pt-6 pb-32">{children}</main>
      <footer className="mt-auto h-[200px] border-t bg-muted/20">
        <div className="mx-auto flex h-full max-w-4xl flex-col justify-center gap-2 px-6">
          <p className="font-semibold tracking-tight">{currentProperty.name}</p>
          <p className="text-sm text-muted-foreground">
            Powered by GuestHouse
          </p>
        </div>
      </footer>
    </div>
  );
}
