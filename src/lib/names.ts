/** Person fields used to build a display name. */
export interface PersonNameFields {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

/**
 * Formats a person's name for display: "First Last", then email if no name
 * parts are set, then an optional fallback (e.g. "Your host").
 */
export function formatPersonName(
  person: PersonNameFields | null | undefined,
  fallback?: string
): string | undefined {
  if (!person) return fallback;

  const first = person.first_name?.trim() ?? '';
  const last = person.last_name?.trim() ?? '';
  const full = [first, last].filter(Boolean).join(' ');
  if (full) return full;

  const email = person.email?.trim();
  if (email) return email;

  return fallback;
}
