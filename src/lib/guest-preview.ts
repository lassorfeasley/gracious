/** Dev-only guest UI states for invitation preview (`?preview=1`). */

export type GuestPreviewAs = 'signed-out' | 'booking' | 'booked';

export type GuestPreviewBookingStatus = 'requested' | 'approved';

export function isGuestPreviewEnabled(preview?: string): boolean {
  return process.env.NODE_ENV !== 'production' && preview === '1';
}

export function parseGuestPreviewAs(as?: string): GuestPreviewAs {
  if (as === 'signed-out' || as === 'booked') return as;
  return 'booking';
}

export function parseGuestPreviewBookingStatus(
  status?: string
): GuestPreviewBookingStatus {
  if (status === 'approved') return 'approved';
  return 'requested';
}

export function guestPreviewQuery(
  as: GuestPreviewAs,
  bookingStatus?: GuestPreviewBookingStatus
): string {
  const params = new URLSearchParams({ preview: '1', as });
  if (as === 'booked' && bookingStatus) {
    params.set('status', bookingStatus);
  }
  return params.toString();
}

export function appendGuestPreviewToPath(
  path: string,
  as: GuestPreviewAs,
  bookingStatus?: GuestPreviewBookingStatus
): string {
  const q = guestPreviewQuery(as, bookingStatus);
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
      showBooking: isAuthenticated,
      showManageStay: false,
      effectiveAuthenticated: isAuthenticated,
    };
  }

  switch (guestPreviewAs) {
    case 'signed-out':
      return {
        showSignIn: true,
        showBooking: false,
        showManageStay: false,
        effectiveAuthenticated: false,
      };
    case 'booked':
      return {
        showSignIn: false,
        showBooking: false,
        showManageStay: true,
        effectiveAuthenticated: true,
      };
    default:
      return {
        showSignIn: false,
        showBooking: true,
        showManageStay: false,
        effectiveAuthenticated: true,
      };
  }
}
