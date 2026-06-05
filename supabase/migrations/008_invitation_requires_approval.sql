-- Host chooses whether guest bookings need manual approval.
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.invitations.requires_approval IS
  'When true, guest bookings are created as requested and need host approval. When false, bookings are auto-approved.';
