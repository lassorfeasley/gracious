-- Precise property location for the map (set via the house profile pin-drop).
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
