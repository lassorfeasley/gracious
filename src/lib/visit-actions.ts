import { createAdminClient } from '@/lib/supabase/admin';
import { canManageProperty } from '@/lib/auth';
import { getBookingWithDetails } from '@/lib/bookings';
import {
  notifyBookingApproved,
  notifyBookingDeclined,
  notifyBookingCancelled,
} from '@/lib/email/notifications';

/**
 * Single source of truth for the approve / decline / cancel transitions on a
 * stay. Both callers — the `PATCH /api/bookings/[id]` API route and the
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

export type BookingActionFailureReason =
  | 'not_found'
  | 'forbidden'
  | 'not_pending';

export type BookingActionResult =
  | { ok: true; status: 'approved' | 'declined' | 'cancelled' }
  | { ok: false; reason: BookingActionFailureReason };

interface ActionOptions {
  /**
   * When set, the action only applies if the booking belongs to this property.
   * Used by the requests page so a tampered booking id from an email link can't
   * touch a stay on a property the host doesn't manage.
   */
  propertyId?: string;
}

export async function approveBooking(
  bookingId: string,
  actorUserId: string,
  options: ActionOptions = {}
): Promise<BookingActionResult> {
  const booking = await getBookingWithDetails(bookingId);
  if (!booking || (options.propertyId && booking.property_id !== options.propertyId)) {
    return { ok: false, reason: 'not_found' };
  }
  if (!(await canManageProperty(booking.property_id, actorUserId))) {
    return { ok: false, reason: 'forbidden' };
  }
  if (booking.status !== 'requested') {
    return { ok: false, reason: 'not_pending' };
  }

  const admin = createAdminClient();
  const { data: updated } = await admin
    .from('bookings')
    .update({ status: 'approved' })
    .eq('id', bookingId)
    .eq('status', 'requested')
    .select('id')
    .maybeSingle();

  // Lost the race: another approve/decline already moved this booking. Don't
  // re-send the confirmation.
  if (!updated) return { ok: false, reason: 'not_pending' };

  notifyBookingApproved(bookingId).catch(console.error);
  return { ok: true, status: 'approved' };
}

export async function declineBooking(
  bookingId: string,
  actorUserId: string,
  options: ActionOptions & { declineMessage?: string } = {}
): Promise<BookingActionResult> {
  const booking = await getBookingWithDetails(bookingId);
  if (!booking || (options.propertyId && booking.property_id !== options.propertyId)) {
    return { ok: false, reason: 'not_found' };
  }
  if (!(await canManageProperty(booking.property_id, actorUserId))) {
    return { ok: false, reason: 'forbidden' };
  }
  if (booking.status !== 'requested') {
    return { ok: false, reason: 'not_pending' };
  }

  const admin = createAdminClient();
  const { data: updated } = await admin
    .from('bookings')
    .update({
      status: 'declined',
      decline_message: options.declineMessage ?? null,
    })
    .eq('id', bookingId)
    .eq('status', 'requested')
    .select('id')
    .maybeSingle();

  if (!updated) return { ok: false, reason: 'not_pending' };

  notifyBookingDeclined(bookingId, options.declineMessage).catch(console.error);
  return { ok: true, status: 'declined' };
}

export async function cancelBooking(
  bookingId: string,
  actorUserId: string,
  options: ActionOptions = {}
): Promise<BookingActionResult> {
  const booking = await getBookingWithDetails(bookingId);
  if (!booking || (options.propertyId && booking.property_id !== options.propertyId)) {
    return { ok: false, reason: 'not_found' };
  }

  const isOwner = await canManageProperty(booking.property_id, actorUserId);
  const isGuest = booking.guest_user_id === actorUserId;
  if (!isOwner && !isGuest) {
    return { ok: false, reason: 'forbidden' };
  }

  // Only an active stay can be cancelled; re-cancelling a settled booking is a
  // no-op so the other party isn't emailed twice.
  if (booking.status !== 'requested' && booking.status !== 'approved') {
    return { ok: false, reason: 'not_pending' };
  }

  const admin = createAdminClient();
  const { data: updated } = await admin
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .in('status', ['requested', 'approved'])
    .select('id')
    .maybeSingle();

  if (!updated) return { ok: false, reason: 'not_pending' };

  notifyBookingCancelled(bookingId, isGuest ? 'guest' : 'owner').catch(
    console.error
  );
  return { ok: true, status: 'cancelled' };
}
