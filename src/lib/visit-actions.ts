import { createAdminClient } from '@/lib/supabase/admin';
import { canManageProperty } from '@/lib/auth';
import { getVisitWithDetails } from '@/lib/visits';
import {
  notifyVisitApproved,
  notifyVisitDeclined,
  notifyVisitCancelled,
} from '@/lib/email/notifications';

/**
 * Single source of truth for the approve / decline / cancel transitions on a
 * stay. Both callers — the `PATCH /api/visits/[id]` API route and the
 * one-click email links handled in the requests page — go through here so the
 * authorization, idempotency, and notification behavior can't drift apart
 * between the two entry points.
 *
 * Every transition is guarded by a conditional status update (e.g. only move a
 * booking out of `requested` if it is *still* `requested`). That guard is what
 * makes a double approve — two browser tabs, an email link plus a dashboard
 * click, a refresh of an already-handled request — a no-op instead of a
 * duplicate guest email.
 */

export type VisitActionFailureReason =
  | 'not_found'
  | 'forbidden'
  | 'not_pending';

export type VisitActionResult =
  | { ok: true; status: 'approved' | 'declined' | 'cancelled' }
  | { ok: false; reason: VisitActionFailureReason };

interface ActionOptions {
  /**
   * When set, the action only applies if the booking belongs to this property.
   * Used by the requests page so a tampered booking id from an email link can't
   * touch a stay on a property the host doesn't manage.
   */
  propertyId?: string;
}

export async function approveVisit(
  visitId: string,
  actorUserId: string,
  options: ActionOptions = {}
): Promise<VisitActionResult> {
  const visit = await getVisitWithDetails(visitId);
  if (!visit || (options.propertyId && visit.property_id !== options.propertyId)) {
    return { ok: false, reason: 'not_found' };
  }
  if (!(await canManageProperty(visit.property_id, actorUserId))) {
    return { ok: false, reason: 'forbidden' };
  }
  if (visit.status !== 'requested') {
    return { ok: false, reason: 'not_pending' };
  }

  const admin = createAdminClient();
  const { data: updated } = await admin
    .from('visits')
    .update({ status: 'approved' })
    .eq('id', visitId)
    .eq('status', 'requested')
    .select('id')
    .maybeSingle();

  // Lost the race: another approve/decline already moved this booking. Don't
  // re-send the confirmation.
  if (!updated) return { ok: false, reason: 'not_pending' };

  notifyVisitApproved(visitId).catch(console.error);
  return { ok: true, status: 'approved' };
}

export async function declineVisit(
  visitId: string,
  actorUserId: string,
  options: ActionOptions & { declineMessage?: string } = {}
): Promise<VisitActionResult> {
  const visit = await getVisitWithDetails(visitId);
  if (!visit || (options.propertyId && visit.property_id !== options.propertyId)) {
    return { ok: false, reason: 'not_found' };
  }
  if (!(await canManageProperty(visit.property_id, actorUserId))) {
    return { ok: false, reason: 'forbidden' };
  }
  if (visit.status !== 'requested') {
    return { ok: false, reason: 'not_pending' };
  }

  const admin = createAdminClient();
  const { data: updated } = await admin
    .from('visits')
    .update({
      status: 'declined',
      decline_message: options.declineMessage ?? null,
    })
    .eq('id', visitId)
    .eq('status', 'requested')
    .select('id')
    .maybeSingle();

  if (!updated) return { ok: false, reason: 'not_pending' };

  notifyVisitDeclined(visitId, options.declineMessage).catch(console.error);
  return { ok: true, status: 'declined' };
}

export async function cancelVisit(
  visitId: string,
  actorUserId: string,
  options: ActionOptions = {}
): Promise<VisitActionResult> {
  const visit = await getVisitWithDetails(visitId);
  if (!visit || (options.propertyId && visit.property_id !== options.propertyId)) {
    return { ok: false, reason: 'not_found' };
  }

  const isOwner = await canManageProperty(visit.property_id, actorUserId);
  const isGuest = visit.guest_user_id === actorUserId;
  if (!isOwner && !isGuest) {
    return { ok: false, reason: 'forbidden' };
  }

  // Only an active stay can be cancelled; re-cancelling a settled booking is a
  // no-op so the other party isn't emailed twice.
  if (visit.status !== 'requested' && visit.status !== 'approved') {
    return { ok: false, reason: 'not_pending' };
  }

  const admin = createAdminClient();
  const { data: updated } = await admin
    .from('visits')
    .update({ status: 'cancelled' })
    .eq('id', visitId)
    .in('status', ['requested', 'approved'])
    .select('id')
    .maybeSingle();

  if (!updated) return { ok: false, reason: 'not_pending' };

  notifyVisitCancelled(visitId, isGuest ? 'guest' : 'owner').catch(
    console.error
  );
  return { ok: true, status: 'cancelled' };
}
