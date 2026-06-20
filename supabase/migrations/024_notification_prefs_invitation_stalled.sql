-- Host nudge when an invited guest hasn't responded after the reminder drip,
-- so the host can share the invite link directly. Opt-out, subscribed by default.

ALTER TABLE public.users
  ALTER COLUMN notification_prefs
  SET DEFAULT '{"booking_requests": true, "booking_cancelled": true, "invitation_expiring": true, "invitation_stalled": true, "guest_reminders": true, "host_tips": true, "product_updates": true}'::jsonb;

UPDATE public.users
SET notification_prefs = '{"invitation_stalled": true}'::jsonb || notification_prefs
WHERE NOT (notification_prefs ? 'invitation_stalled');
