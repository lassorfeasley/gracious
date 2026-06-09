-- Checkout instructions + per-property timezone for lifecycle emails
-- (morning-of-checkout instructions and post-stay follow-ups are scheduled
-- relative to the property's local time).

ALTER TABLE public.properties
  ADD COLUMN checkout_instructions TEXT,
  ADD COLUMN checkout_time TEXT,
  ADD COLUMN timezone TEXT NOT NULL DEFAULT 'America/Denver';
