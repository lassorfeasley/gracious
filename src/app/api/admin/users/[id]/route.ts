import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { isDevAdminPreviewEnabled } from '@/lib/dev-tools';
import { isSiteAdmin } from '@/lib/site-admin';

const patchSchema = z.object({
  role: z.enum(['guest', 'owner', 'admin']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await getCurrentUser();
    if (
      !actor ||
      (!isSiteAdmin(actor) && !isDevAdminPreviewEnabled())
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (id === actor.id && parsed.data.role !== 'admin') {
      return NextResponse.json(
        { error: 'You cannot remove your own admin access' },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: user, error } = await admin
      .from('users')
      .update({ role: parsed.data.role })
      .eq('id', id)
      .select()
      .single();

    if (error || !user) {
      return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
