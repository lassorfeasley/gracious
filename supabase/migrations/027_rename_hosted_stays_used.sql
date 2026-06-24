-- Rename the freemium usage counter hosted_stays_used → hosted_visits_used to
-- match the canonical "visit" nomenclature (see migration 025, which renamed
-- bookings → visits). Guarded so it is safe to re-run from any partial state.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'hosted_stays_used'
  ) THEN
    ALTER TABLE public.users RENAME COLUMN hosted_stays_used TO hosted_visits_used;
  END IF;
END $$;

-- Rename the CHECK constraint that Postgres left on the old name.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_hosted_stays_used_check'
  ) THEN
    ALTER TABLE public.users
      RENAME CONSTRAINT users_hosted_stays_used_check TO users_hosted_visits_used_check;
  END IF;
END $$;
