import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isDevAdminPreviewEnabled } from '@/lib/dev-tools';
import { isSiteAdmin } from '@/lib/site-admin';
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

  if (data) {
    const user = data as User;
    const metaRole = authUser.user_metadata?.role as string | undefined;
    if (metaRole === 'owner' && user.role !== 'owner') {
      const admin = createAdminClient();
      const { data: updated } = await admin
        .from('users')
        .update({ role: 'owner' })
        .eq('id', authUser.id)
        .select()
        .single();
      await linkOfflineBookingsToUser(authUser.id, authUser.email!);
      return (updated as User) ?? user;
    }
    await linkOfflineBookingsToUser(authUser.id, authUser.email!);
    return user;
  }

  const admin = createAdminClient();
  const role: UserRole =
    authUser.user_metadata?.role === 'owner' ? 'owner' : 'guest';
  const { data: created } = await admin
    .from('users')
    .upsert({
      id: authUser.id,
      email: authUser.email!,
      name:
        (authUser.user_metadata?.name as string | undefined) ??
        authUser.email!.split('@')[0],
      role,
    })
    .select()
    .single();

  await linkOfflineBookingsToUser(authUser.id, authUser.email!);

  return created as User | null;
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}

export async function requireOwner(): Promise<User> {
  const user = await requireAuth();
  if (isSiteAdmin(user)) redirect('/admin');
  if (user.role !== 'owner') redirect('/my-trips');
  return user;
}

export async function requireSiteAdmin(): Promise<User> {
  const user = await requireAuth();
  if (isDevAdminPreviewEnabled()) return user;
  if (!isSiteAdmin(user)) redirect('/');
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

  await linkOfflineBookingsToUser(userId, email);
}

async function linkOfflineBookingsToUser(userId: string, email: string) {
  const admin = createAdminClient();
  await admin
    .from('bookings')
    .update({ guest_user_id: userId })
    .eq('guest_email', email.toLowerCase())
    .is('guest_user_id', null);
}

export async function getOwnerProperties(userId: string) {
  const { normalizeProperty, isValidProperty } = await import('@/lib/properties');
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
    managed
      ?.map((m) => normalizeProperty(m.property))
      .filter(isValidProperty) ?? [];

  const ownedProps = (owned ?? []).filter(isValidProperty);
  const all = [...ownedProps, ...managedProps];
  const unique = all.filter(
    (p, i, arr) => arr.findIndex((x) => x.id === p.id) === i
  );
  return unique;
}
