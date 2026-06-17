-- Free-tier invitation credits: admin-granted bonus on top of the base allowance.
-- Usage is derived from live invitations/bookings; this column only stores extras.

ALTER TABLE public.users
  ADD COLUMN bonus_invitations INT NOT NULL DEFAULT 0;

ALTER TABLE public.users
  ADD CONSTRAINT users_bonus_invitations_check CHECK (bonus_invitations >= 0);
