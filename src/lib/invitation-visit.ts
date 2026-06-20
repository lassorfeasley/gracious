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

export function guestBookingCtaLabel(invitation: InvitationBookingPolicy): string {
  if (invitation.type === 'prix_fixe') {
    return invitationRequiresApproval(invitation) ? 'Accept stay' : 'Confirm stay';
  }
  return invitationRequiresApproval(invitation)
    ? 'Request to book'
    : 'Book stay';
}

export function guestBookingSuccessMessage(
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

export function guestBookingSidebarNote(
  invitation: InvitationBookingPolicy
): string {
  return invitationRequiresApproval(invitation)
    ? "You won't be charged — your host reviews each request."
    : "Your booking is confirmed — no host approval needed.";
}
