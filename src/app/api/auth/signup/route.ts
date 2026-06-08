import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { signupSchema } from '@/lib/validations';

/**
 * Fallback signup: creates auth user + profile via service role.
 * Use if the DB trigger is not applied yet.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { first_name, last_name, email, password } = parsed.data;
    const admin = createAdminClient();

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name, last_name: last_name ?? null, role: 'owner' },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 });
    }

    const { error: profileError } = await admin.from('users').upsert({
      id: data.user.id,
      email,
      first_name,
      last_name: last_name ?? null,
      role: 'owner',
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ userId: data.user.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
