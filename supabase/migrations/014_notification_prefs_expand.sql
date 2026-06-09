-- Expand notification preferences: guest stay reminders (opt-out) and host
-- product-update marketing emails (opt-out). All default to subscribed.

ALTER TABLE public.users
  ALTER COLUMN notification_prefs
  SET DEFAULT '{"booking_requests": true, "booking_cancelled": true, "invitation_expiring": true, "guest_reminders": true, "product_updates": true}'::jsonb;

-- Backfill existing rows with the new keys, leaving any explicit choices intact.
UPDATE public.users
SET notification_prefs =
  '{"guest_reminders": true, "product_updates": true}'::jsonb || notification_prefs
WHERE NOT (notification_prefs ? 'guest_reminders')
   OR NOT (notification_prefs ? 'product_updates');
