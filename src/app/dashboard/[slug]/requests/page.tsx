import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getDashboardProperty } from '@/lib/dashboard-property';

export default async function RequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ visit?: string; action?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  // Preserve one-click email actions (?visit=&action=approve|decline): run
  // the action here, then forward to the merged Visits hub with a notice.
  let notice: string | null = null;
  if (sp.visit && sp.action) {
    const property = await getDashboardProperty(slug);
    const user = await getCurrentUser();
    if (user) {
      notice = await handleQuickAction(
        property.id,
        user.id,
        sp.visit,
        sp.action
      );
    }
  }

  const query = notice ? `&notice=${notice}` : '';
  redirect(`/dashboard/${slug}/visits?status=requested${query}`);
}

async function handleQuickAction(
  propertyId: string,
  actorUserId: string,
  visitId: string,
  action: string
): Promise<string | null> {
  if (action !== 'approve' && action !== 'decline') return null;
  const { approveVisit, declineVisit } = await import(
    '@/lib/visit-actions'
  );

  // Scope by propertyId so a tampered visit id from an email link can't act
  // on a visit this host doesn't manage. The shared action also enforces the
  // pending-only guard, so a refresh of an already-handled request is a no-op.
  const result =
    action === 'approve'
      ? await approveVisit(visitId, actorUserId, { propertyId })
      : await declineVisit(visitId, actorUserId, { propertyId });

  if (!result.ok) return 'handled';
  return action === 'approve' ? 'approved' : 'declined';
}
