import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, canManageProperty } from '@/lib/auth';
import { getVisitWithDetails, checkRoomConflicts } from '@/lib/visits';
import { visitUpdateSchema } from '@/lib/validations';
import { notifyVisitApproved } from '@/lib/email/notifications';
import {
  approveVisit,
  declineVisit,
  cancelVisit,
  type VisitActionResult,
} from '@/lib/visit-actions';
import type { Room } from '@/types/database';

function actionFailureResponse(
  result: Extract<VisitActionResult, { ok: false }>
): NextResponse {
  switch (result.reason) {
    case 'not_found':
      return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
    case 'forbidden':
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    case 'not_pending':
      return NextResponse.json(
        { error: 'This visit can no longer be updated' },
        { status: 409 }
      );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action, decline_message } = body as {
      action: 'approve' | 'decline' | 'cancel' | 'update';
      decline_message?: string;
    };

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'approve' || action === 'decline' || action === 'cancel') {
      let result: VisitActionResult;
      if (action === 'approve') {
        result = await approveVisit(id, user.id);
      } else if (action === 'decline') {
        result = await declineVisit(id, user.id, {
          declineMessage: decline_message,
        });
      } else {
        result = await cancelVisit(id, user.id);
      }

      if (!result.ok) {
        return actionFailureResponse(result);
      }

      const updated = await getVisitWithDetails(id);
      return NextResponse.json({ visit: updated });
    }

    if (action === 'update') {
      const visit = await getVisitWithDetails(id);
      if (!visit) {
        return NextResponse.json({ error: 'Visit not found' }, { status: 404 });
      }
      if (!(await canManageProperty(visit.property_id, user.id))) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const parsed = visitUpdateSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.flatten().fieldErrors },
          { status: 400 }
        );
      }
      const data = parsed.data;

      if (new Date(data.check_out) <= new Date(data.check_in)) {
        return NextResponse.json(
          { error: 'Check-out must be after check-in' },
          { status: 400 }
        );
      }

      const admin = createAdminClient();
      const { data: rooms } = await admin
        .from('rooms')
        .select('*')
        .eq('property_id', visit.property_id)
        .in('id', data.room_ids);

      if (!rooms || rooms.length !== data.room_ids.length) {
        return NextResponse.json(
          { error: 'One or more selected rooms are invalid for this property' },
          { status: 400 }
        );
      }

      const maxOcc = (rooms as Room[]).reduce(
        (sum, r) => sum + r.max_occupancy,
        0
      );
      if (data.party_size > maxOcc) {
        return NextResponse.json(
          {
            error: `Party size exceeds maximum occupancy (${maxOcc}) for selected rooms`,
          },
          { status: 400 }
        );
      }

      const conflicts = await checkRoomConflicts(
        data.room_ids,
        data.check_in,
        data.check_out,
        id
      );
      if (conflicts.hasConflict) {
        return NextResponse.json(
          { error: 'Selected dates conflict with an existing visit or block' },
          { status: 400 }
        );
      }

      await admin
        .from('visits')
        .update({ party_size: data.party_size, notes: data.notes ?? null })
        .eq('id', id);

      await admin
        .from('visit_dates')
        .update({ check_in: data.check_in, check_out: data.check_out })
        .eq('visit_id', id);

      await admin.from('visit_rooms').delete().eq('visit_id', id);
      await admin.from('visit_rooms').insert(
        data.room_ids.map((room_id) => ({ visit_id: id, room_id }))
      );

      // Inform the guest of the change (re-sends confirmation with new details).
      if (visit.status === 'approved' && visit.notify_guest && visit.guest.email) {
        notifyVisitApproved(id).catch(console.error);
      }

      const updated = await getVisitWithDetails(id);
      return NextResponse.json({ visit: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
