/** URL-safe key for a guest profile (email-based). */
export function guestKeyFromEmail(email: string): string {
  return `e-${encodeURIComponent(email.trim().toLowerCase())}`;
}

/** Host dashboard path to a guest's profile (invitation + visit history). */
export function guestProfileHref(slug: string, guestEmail: string): string {
  return `/dashboard/${slug}/guests/${guestKeyFromEmail(guestEmail)}`;
}

/** URL-safe key for a manual guest with no email. */
export function guestKeyFromManualVisit(visitId: string): string {
  return `m-${visitId}`;
}

export function parseGuestKey(
  guestKey: string
): { type: 'email'; email: string } | { type: 'manual'; visitId: string } | null {
  if (guestKey.startsWith('e-')) {
    try {
      const email = decodeURIComponent(guestKey.slice(2));
      if (email.includes('@')) return { type: 'email', email };
    } catch {
      return null;
    }
  }
  if (guestKey.startsWith('m-')) {
    const visitId = guestKey.slice(2);
    if (visitId.length > 0) return { type: 'manual', visitId };
  }
  return null;
}
