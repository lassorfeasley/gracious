import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser, canManageProperty } from '@/lib/auth';
import { invitationSchema } from '@/lib/validations';
import { notifyInvitationSent } from '@/lib/email/notifications';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { property_id, ...rest } = body;
    const parsed = invitationSchema.safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const canManage = await canManageProperty(property_id, user.id);
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const data = parsed.data;
    const admin = createAdminClient();

    const { data: invitation, error } = await admin
      .from('invitations')
      .insert({
        property_id,
        guest_email: data.guest_email.toLowerCase(),
        guest_first_name: data.guest_first_name ?? null,
        guest_last_name: data.guest_last_name ?? null,
        type: data.type,
        message: data.message ?? null,
        requires_approval: data.requires_approval,
        expires_at: data.expires_at ?? null,
        created_by: user.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: error?.message }, { status: 500 });
    }

    await admin.from('invitation_rooms').insert(
      data.room_ids.map((room_id) => ({
        invitation_id: invitation.id,
        room_id,
      }))
    );

    if (data.windows && data.windows.length > 0) {
      await admin.from('invitation_windows').insert(
        data.windows.map((w) => ({
          invitation_id: invitation.id,
          start_date: w.start_date,
          end_date: w.end_date,
        }))
      );
    } else if (data.type === 'prix_fixe' && data.windows?.length) {
      // prix fixe requires windows
    }

    let emailSent = true;
    let emailError: string | undefined;
    try {
      await notifyInvitationSent(invitation.id);
    } catch (err) {
      emailSent = false;
      emailError =
        err instanceof Error ? err.message : 'Failed to send invitation email';
      console.error(err);
    }

    return NextResponse.json({ invitation, emailSent, emailError });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invitation_id, action } = await request.json();
    const admin = createAdminClient();

    const { data: invitation } = await admin
      .from('invitations')
      .select('*')
      .eq('id', invitation_id)
      .single();

    if (!invitation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const canManage = await canManageProperty(invitation.property_id, user.id);
    if (!canManage) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (action === 'revoke') {
      await admin
        .from('invitations')
        .update({ status: 'revoked' })
        .eq('id', invitation_id);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
