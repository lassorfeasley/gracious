-- Rename booking → visit nomenclature (tables, enum, columns, indexes, policies, prefs)
-- Written to be idempotent AND defensive: every statement is guarded on the
-- existence of the relation/column it touches, so it is safe to re-run from any
-- partially-applied state.

-- Enum
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'booking_status' AND n.nspname = 'public'
  ) THEN
    ALTER TYPE public.booking_status RENAME TO visit_status;
  END IF;
END $$;

-- Tables
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'bookings') THEN
    ALTER TABLE public.bookings RENAME TO visits;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'booking_rooms') THEN
    ALTER TABLE public.booking_rooms RENAME TO visit_rooms;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'booking_dates') THEN
    ALTER TABLE public.booking_dates RENAME TO visit_dates;
  END IF;
END $$;

-- Foreign-key columns
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'visit_rooms' AND column_name = 'booking_id') THEN
    ALTER TABLE public.visit_rooms RENAME COLUMN booking_id TO visit_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'visit_dates' AND column_name = 'booking_id') THEN
    ALTER TABLE public.visit_dates RENAME COLUMN booking_id TO visit_id;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'notifications_log' AND column_name = 'booking_id') THEN
    ALTER TABLE public.notifications_log RENAME COLUMN booking_id TO visit_id;
  END IF;
END $$;

-- Indexes (ALTER INDEX IF EXISTS is a no-op when the old name is gone)
ALTER INDEX IF EXISTS idx_bookings_property RENAME TO idx_visits_property;
ALTER INDEX IF EXISTS idx_bookings_guest RENAME TO idx_visits_guest;
ALTER INDEX IF EXISTS idx_bookings_status RENAME TO idx_visits_status;
ALTER INDEX IF EXISTS idx_bookings_guest_email RENAME TO idx_visits_guest_email;
ALTER INDEX IF EXISTS idx_booking_rooms_booking RENAME TO idx_visit_rooms_visit;
ALTER INDEX IF EXISTS idx_booking_dates_booking RENAME TO idx_visit_dates_visit;
ALTER INDEX IF EXISTS idx_booking_dates_range RENAME TO idx_visit_dates_range;
ALTER INDEX IF EXISTS idx_notifications_log_booking RENAME TO idx_notifications_log_visit;

-- RLS policies on visits (USING clauses unchanged, just rename) — guarded on the table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'visits') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'visits' AND policyname = 'bookings_select') THEN
      ALTER POLICY bookings_select ON public.visits RENAME TO visits_select;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'visits' AND policyname = 'bookings_insert') THEN
      ALTER POLICY bookings_insert ON public.visits RENAME TO visits_insert;
    END IF;
    IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'visits' AND policyname = 'bookings_update') THEN
      ALTER POLICY bookings_update ON public.visits RENAME TO visits_update;
    END IF;
  END IF;
END $$;

-- Recreate child-table policies so they reference visits / visit_id — guarded on each table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'visit_rooms') THEN
    DROP POLICY IF EXISTS booking_rooms_all ON public.visit_rooms;
    DROP POLICY IF EXISTS visit_rooms_all ON public.visit_rooms;
    EXECUTE 'CREATE POLICY visit_rooms_all ON public.visit_rooms FOR ALL USING (EXISTS (SELECT 1 FROM public.visits v WHERE v.id = visit_id AND (v.guest_user_id = auth.uid() OR public.can_manage_property(v.property_id))))';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'visit_dates') THEN
    DROP POLICY IF EXISTS booking_dates_all ON public.visit_dates;
    DROP POLICY IF EXISTS visit_dates_all ON public.visit_dates;
    EXECUTE 'CREATE POLICY visit_dates_all ON public.visit_dates FOR ALL USING (EXISTS (SELECT 1 FROM public.visits v WHERE v.id = visit_id AND (v.guest_user_id = auth.uid() OR public.can_manage_property(v.property_id))))';
  END IF;
END $$;

-- notification_prefs JSON keys: booking_requests → visit_requests, booking_cancelled → visit_cancelled.
-- COALESCE prefers an already-migrated visit_* value so re-running never resets a user's choice.
UPDATE public.users
SET notification_prefs = (
  notification_prefs
    - 'booking_requests'
    - 'booking_cancelled'
  ) || jsonb_build_object(
    'visit_requests',
      COALESCE(notification_prefs->'booking_requests', notification_prefs->'visit_requests', 'true'::jsonb),
    'visit_cancelled',
      COALESCE(notification_prefs->'booking_cancelled', notification_prefs->'visit_cancelled', 'true'::jsonb)
  )
WHERE notification_prefs ? 'booking_requests'
   OR notification_prefs ? 'booking_cancelled'
   OR NOT (notification_prefs ? 'visit_requests');

ALTER TABLE public.users
  ALTER COLUMN notification_prefs
  SET DEFAULT '{"visit_requests": true, "visit_cancelled": true, "invitation_expiring": true, "invitation_stalled": true, "guest_reminders": true, "host_tips": true, "product_updates": true}'::jsonb;

-- notifications_log type strings (WHERE clauses make these naturally idempotent)
UPDATE public.notifications_log SET type = 'visit_approved' WHERE type = 'booking_approved';
UPDATE public.notifications_log SET type = 'visit_declined' WHERE type = 'booking_declined';
UPDATE public.notifications_log SET type = 'visit_cancelled' WHERE type = 'booking_cancelled';
UPDATE public.notifications_log SET type = 'visit_request' WHERE type = 'booking_request';
