import type { InvitationType } from '@/types/database';

/** Short label shown in pickers, tables, and badges. */
export const INVITATION_TYPE_LABELS: Record<InvitationType, string> = {
  standing: 'Open invitation',
  date_offer: 'Date range',
  prix_fixe: 'Fixed date',
};

/** One-line explanation for hosts choosing a type. */
export const INVITATION_TYPE_DESCRIPTIONS: Record<InvitationType, string> = {
  standing: 'They can request any available dates.',
  date_offer: 'They choose dates within specific windows you offer.',
  prix_fixe: 'A fixed set of dates they accept as-is.',
};

/** Guest-facing explanation on the invite page. */
export const INVITATION_TYPE_GUEST_DESCRIPTIONS: Record<InvitationType, string> =
  {
    standing:
      'There’s no set window — request any available dates within your invited rooms.',
    date_offer:
      'Choose your dates within the windows your host has opened on the calendar.',
    prix_fixe:
      'Your host has offered specific dates — accept the stay exactly as proposed.',
  };

/** Lowercase phrase for invitation headlines, e.g. "a date range invitation". */
export const INVITATION_TYPE_HEADLINE_PHRASE: Record<InvitationType, string> = {
  standing: 'open',
  date_offer: 'date range',
  prix_fixe: 'fixed date',
};

export const INVITATION_TYPE_OPTIONS = (
  ['standing', 'date_offer', 'prix_fixe'] as const
).map((value) => ({
  value,
  label: INVITATION_TYPE_LABELS[value],
  description: INVITATION_TYPE_DESCRIPTIONS[value],
}));
