-- Host can offer an invitation as "entire home only": the guest books the whole
-- property and cannot deselect individual rooms. Enforcement also happens in the
-- app layer (booking validation), but the intent is stored here.
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS whole_home BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.invitations.whole_home IS
  'When true, the invitation is for the entire home: the guest must book all offered rooms and cannot pick a subset.';
