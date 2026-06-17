import { createAdminClient } from '@/lib/supabase/admin';
import { FREE_INCLUDED_INVITATIONS, type PlanId } from '@/lib/pricing';

export interface AccountUsage {
  plan: PlanId;
  used: number;
  limit: number;
  remaining: number;
  atLimit: boolean;
  bonusInvitations: number;
}

export class InvitationLimitReachedError extends Error {
  readonly code = 'limit_reached' as const;
  readonly plan: PlanId;
  readonly used: number;
  readonly limit: number;

  constructor(usage: AccountUsage) {
    super('Invitation limit reached');
    this.name = 'InvitationLimitReachedError';
    this.plan = usage.plan;
    this.used = usage.used;
    this.limit = usage.limit;
  }
}

export function toLimitReachedPayload(error: InvitationLimitReachedError) {
  return {
    error: error.code,
    plan: error.plan,
    used: error.used,
    limit: error.limit,
  };
}

async function countInvitationUsage(
  admin: ReturnType<typeof createAdminClient>,
  ownerId: string
): Promise<number> {
  const { data: properties } = await admin
    .from('properties')
    .select('id')
    .eq('owner_id', ownerId);

  const propertyIds = properties?.map((p) => p.id) ?? [];
  if (propertyIds.length === 0) return 0;

  const [{ count: pendingCount }, { count: activeBookingCount }] =
    await Promise.all([
      admin
        .from('invitations')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .eq('status', 'pending'),
      admin
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .in('property_id', propertyIds)
        .not('invitation_id', 'is', null)
        .in('status', ['requested', 'approved']),
    ]);

  return (pendingCount ?? 0) + (activeBookingCount ?? 0);
}

export async function getAccountUsage(ownerId: string): Promise<AccountUsage> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('users')
    .select('plan, bonus_invitations')
    .eq('id', ownerId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Owner account not found');
  }

  const plan = (data.plan as PlanId) ?? 'free';
  const bonusInvitations = data.bonus_invitations ?? 0;
  const used = await countInvitationUsage(admin, ownerId);
  const limit = FREE_INCLUDED_INVITATIONS + bonusInvitations;
  const remaining = Math.max(0, limit - used);

  return {
    plan,
    used,
    limit,
    remaining,
    atLimit: plan === 'free' && used >= limit,
    bonusInvitations,
  };
}

export async function assertCanSendInvitation(
  ownerId: string
): Promise<AccountUsage> {
  const usage = await getAccountUsage(ownerId);
  if (usage.atLimit) {
    throw new InvitationLimitReachedError(usage);
  }
  return usage;
}

export async function getPropertyOwnerId(propertyId: string): Promise<string> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('properties')
    .select('owner_id')
    .eq('id', propertyId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Property not found');
  }

  return data.owner_id;
}
