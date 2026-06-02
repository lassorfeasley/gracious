import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { User, UserRole } from '@/types/database';

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getCurrentUser(): Promise<User | null> {
  const authUser = await getAuthUser();
  if (!authUser) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  return data as User | null;
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireOwner(): Promise<User> {
  const user = await requireAuth();
  if (user.role !== 'owner') redirect('/my-trips');
  return user;
}

export async function canManageProperty(
  propertyId: string,
  userId: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { data: property } = await admin
    .from('properties')
    .select('owner_id')
    .eq('id', propertyId)
    .single();

  if (!property) return false;
  if (property.owner_id === userId) return true;

  const { data: manager } = await admin
    .from('property_managers')
    .select('id')
    .eq('property_id', propertyId)
    .eq('user_id', userId)
    .single();

  return !!manager;
}

export async function requirePropertyAccess(
  propertyId: string
): Promise<User> {
  const user = await requireOwner();
  const hasAccess = await canManageProperty(propertyId, user.id);
  if (!hasAccess) redirect('/dashboard');
  return user;
}

export async function upsertUserProfile(
  userId: string,
  email: string,
  role: UserRole = 'guest',
  name?: string
) {
  const admin = createAdminClient();
  await admin.from('users').upsert(
    {
      id: userId,
      email,
      role,
      name: name ?? email.split('@')[0],
    },
    { onConflict: 'id' }
  );
}

export async function getOwnerProperties(userId: string) {
  const supabase = await createClient();
  const { data: owned } = await supabase
    .from('properties')
    .select('*')
    .eq('owner_id', userId)
    .order('name');

  const { data: managed } = await supabase
    .from('property_managers')
    .select('property:properties(*)')
    .eq('user_id', userId);

  const managedProps =
    managed?.map((m) => m.property as unknown as import('@/types/database').Property).filter(Boolean) ?? [];

  const all = [...(owned ?? []), ...managedProps];
  const unique = all.filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
  );
  return unique;
}
