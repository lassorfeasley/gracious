/** Dev-only guest UI states for invitation preview (`?preview=1`). */

export type GuestPreviewAs = 'signed-out' | 'visit' | 'confirmed';

export type GuestPreviewVisitStatus = 'requested' | 'approved';

export function isGuestPreviewEnabled(preview?: string): boolean {
  return process.env.NODE_ENV !== 'production' && preview === '1';
}

export function parseGuestPreviewAs(as?: string): GuestPreviewAs {
  if (as === 'signed-out' || as === 'confirmed') return as;
  return 'visit';
}

export function parseGuestPreviewVisitStatus(
  status?: string
): GuestPreviewVisitStatus {
  if (status === 'approved') return 'approved';
  return 'requested';
}

export function guestPreviewQuery(
  as: GuestPreviewAs,
  visitStatus?: GuestPreviewVisitStatus
): string {
  const params = new URLSearchParams({ preview: '1', as });
  if (as === 'confirmed' && visitStatus) {
    params.set('status', visitStatus);
  }
  return params.toString();
}

export function appendGuestPreviewToPath(
  path: string,
  as: GuestPreviewAs,
  visitStatus?: GuestPreviewVisitStatus
): string {
  const q = guestPreviewQuery(as, visitStatus);
  return path.includes('?') ? `${path}&${q}` : `${path}?${q}`;
}

export function resolveGuestPreviewUi(
  previewMode: boolean,
  guestPreviewAs: GuestPreviewAs,
  isAuthenticated: boolean
) {
  if (!previewMode) {
    return {
      showSignIn: !isAuthenticated,
      showVisitRequest: isAuthenticated,
      showManageVisit: false,
      effectiveAuthenticated: isAuthenticated,
    };
  }

  switch (guestPreviewAs) {
    case 'signed-out':
      return {
        showSignIn: true,
        showVisitRequest: false,
        showManageVisit: false,
        effectiveAuthenticated: false,
      };
    case 'confirmed':
      return {
        showSignIn: false,
        showVisitRequest: false,
        showManageVisit: true,
        effectiveAuthenticated: true,
      };
    default:
      return {
        showSignIn: false,
        showVisitRequest: true,
        showManageVisit: false,
        effectiveAuthenticated: true,
      };
  }
}
