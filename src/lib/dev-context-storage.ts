const INVITE_TOKEN_KEY = 'guesthouse:dev:inviteToken';
const PROPERTY_SLUG_KEY = 'guesthouse:dev:propertySlug';

export function getStoredInviteToken(): string | null {
  if (typeof window === 'undefined') return null;
  return (
    localStorage.getItem(INVITE_TOKEN_KEY) ??
    process.env.NEXT_PUBLIC_DEV_INVITE_TOKEN ??
    null
  );
}

export function setStoredInviteToken(token: string) {
  localStorage.setItem(INVITE_TOKEN_KEY, token);
}

export function getStoredPropertySlug(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(PROPERTY_SLUG_KEY);
}

export function setStoredPropertySlug(slug: string) {
  localStorage.setItem(PROPERTY_SLUG_KEY, slug);
}
