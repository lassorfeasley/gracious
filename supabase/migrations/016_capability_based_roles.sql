-- Capability-based access model.
--
-- The old single `user_role` enum (owner | guest | admin) forced a person to be
-- EITHER a host OR a guest, which is wrong: a host frequently travels as a guest
-- and vice versa. Worse, booking a stay overwrote an owner's role to 'guest' and
-- locked them out of their own dashboard.
--
-- New model:
--   * Host capability  -> derived from real data (properties.owner_id /
--                         property_managers). No stored flag, can't drift.
--   * Guest capability -> implicit for every account (invitations + bookings are
--                         matched by email / guest_user_id, never by role).
--   * Platform admin    -> the only role that is NOT derivable, so it becomes an
--                         explicit boolean `is_admin` (plus SITE_ADMIN_EMAILS for
--                         bootstrap, unchanged).

ALTER TABLE public.users
  ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT false;

-- Preserve existing platform admins.
UPDATE public.users SET is_admin = true WHERE role = 'admin';

-- Recreate the signup trigger without the role column. Host status is conferred
-- later by creating a property, so new accounts no longer carry a role.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'first_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      split_part(COALESCE(NEW.email, ''), '@', 1)
    ),
    NULLIF(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user error: %', SQLERRM;
    RAISE;
END;
$$;

-- Retire the role column and its enum type.
ALTER TABLE public.users ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.users DROP COLUMN role;
DROP TYPE public.user_role;
