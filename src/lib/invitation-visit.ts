import type { InvitationType } from '@/types/database';

type InvitationVisitPolicy = {
  type: InvitationType;
  requires_approval: boolean;
};

export function invitationRequiresApproval(
  invitation: Partial<InvitationVisitPolicy>
): boolean {
  return invitation.requires_approval ?? true;
}

export function guestVisitCtaLabel(invitation: InvitationVisitPolicy): string {
  if (invitation.type === 'prix_fixe') {
    return invitationRequiresApproval(invitation)
      ? 'Accept visit'
      : 'Confirm visit';
  }
  return invitationRequiresApproval(invitation)
    ? 'Request a visit'
    : 'Confirm visit';
}

export function guestVisitSuccessMessage(
  invitation: InvitationVisitPolicy
): string {
  if (invitation.type === 'prix_fixe') {
    return invitationRequiresApproval(invitation)
      ? 'Visit accepted! Awaiting confirmation.'
      : 'Your visit is confirmed!';
  }
  return invitationRequiresApproval(invitation)
    ? 'Visit request submitted!'
    : 'Your visit is confirmed!';
}

export function guestVisitSidebarNote(
  invitation: InvitationVisitPolicy
): string {
  return invitationRequiresApproval(invitation)
    ? "You won't be charged — your host reviews each request."
    : 'Your visit is confirmed — no host approval needed.';
}
