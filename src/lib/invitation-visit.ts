import type { InvitationType } from '@/types/database';

type InvitationBookingPolicy = {
  type: InvitationType;
  requires_approval: boolean;
};

export function invitationRequiresApproval(
  invitation: Partial<InvitationBookingPolicy>
): boolean {
  return invitation.requires_approval ?? true;
}

export function guestVisitCtaLabel(invitation: InvitationBookingPolicy): string {
  if (invitation.type === 'prix_fixe') {
    return invitationRequiresApproval(invitation) ? 'Accept stay' : 'Confirm stay';
  }
  return invitationRequiresApproval(invitation)
    ? 'Request to request a visit'
    : 'Confirm visit';
}

export function guestVisitSuccessMessage(
  invitation: InvitationBookingPolicy
): string {
  if (invitation.type === 'prix_fixe') {
    return invitationRequiresApproval(invitation)
      ? 'Stay accepted! Awaiting confirmation.'
      : 'Your stay is confirmed!';
  }
  return invitationRequiresApproval(invitation)
    ? 'Stay request submitted!'
    : 'Your stay is confirmed!';
}

export function guestVisitSidebarNote(
  invitation: InvitationBookingPolicy
): string {
  return invitationRequiresApproval(invitation)
    ? "You won't be charged — your host reviews each request."
    : "Your visit is confirmed — no host approval needed.";
}
