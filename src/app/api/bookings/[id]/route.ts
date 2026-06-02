import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, canManageProperty } from '@/lib/auth';
import { getBookingWithDetails } from '@/lib/bookings';
import {
  notifyBookingApproved,
  notifyBookingDeclined,
  notifyBookingCancelled,
} from '@/lib/email/notifications';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, decline_message } = body as {
      action: 'approve' | 'decline' | 'cancel';
      decline_message?: string;
    };

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const booking = await getBookingWithDetails(id);
    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const isOwner = await canManageProperty(booking.property_id, user.id);
    const isGuest = booking.guest_user_id === user.id;

    const admin = createAdminClient();

    if (action === 'approve') {
      if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      await admin.from('bookings').update({ status: 'approved' }).eq('id', id);
      notifyBookingApproved(id).catch(console.error);
    } else if (action === 'decline') {
      if (!isOwner) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      await admin
        .from('bookings')
        .update({ status: 'declined', decline_message: decline_message ?? null })
        .eq('id', id);
      notifyBookingDeclined(id, decline_message).catch(console.error);
    } else if (action === 'cancel') {
      if (!isOwner && !isGuest) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      await admin.from('bookings').update({ status: 'cancelled' }).eq('id', id);
      notifyBookingCancelled(id, isGuest ? 'guest' : 'owner').catch(console.error);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const updated = await getBookingWithDetails(id);
    return NextResponse.json({ booking: updated });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
