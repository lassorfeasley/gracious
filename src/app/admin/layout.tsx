import { requireSiteAdmin } from '@/lib/auth';
import { AdminNav } from '@/components/admin/admin-nav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireSiteAdmin();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AdminNav userEmail={user.email} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
