import type { User } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import type { InvitationWithDetails } from '@/types/database';

export function guestMatchesInvitation(
  authUser: Pick<User, 'email' | 'phone'> | null,
  invitation: { guest_email: string }
): boolean {
  if (!authUser?.email) return false;
  return authUser.email.toLowerCase() === invitation.guest_email.toLowerCase();
}

export async function getInvitationByToken(
  token: string
): Promise<InvitationWithDetails | null> {
  const admin = createAdminClient();

  const { data: invitation, error } = await admin
    .from('invitations')
    .select(
      `
      *,
      property:properties(*, property_images(*), owner:users!owner_id(first_name, last_name)),
      invitation_rooms(room:rooms(*, room_images(*))),
      invitation_windows(*)
    `
    )
    .eq('token', token)
    .single();

  if (error || !invitation) return null;

  // Mark expired if past expires_at
  if (
    invitation.expires_at &&
    new Date(invitation.expires_at) < new Date() &&
    invitation.status === 'pending'
  ) {
    await admin
      .from('invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id);
    invitation.status = 'expired';
  }

  const property = invitation.property as import('@/types/database').Property;
  const propertyImages = property.property_images ?? [];

  const rooms =
    invitation.invitation_rooms?.map(
      (ir: { room: import('@/types/database').Room }) => ir.room
    ) ?? [];

  return {
    ...invitation,
    property: {
      ...property,
      property_images: propertyImages,
    },
    rooms: rooms.sort(
      (a: { display_order: number }, b: { display_order: number }) =>
        a.display_order - b.display_order
    ),
    windows: invitation.invitation_windows ?? [],
  } as InvitationWithDetails;
}

export function isInvitationActive(invitation: InvitationWithDetails): boolean {
  if (invitation.status === 'revoked' || invitation.status === 'expired')
    return false;
  if (
    invitation.expires_at &&
    new Date(invitation.expires_at) < new Date()
  )
    return false;
  return true;
}

export function inviteUrl(token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${base}/invite/${token}`;
}
