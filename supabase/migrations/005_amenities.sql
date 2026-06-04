-- Structured amenities for properties (the home) and rooms.
-- `amenities` is a JSONB array of objects: { "key": "...", "label": "...", "note": "..." }
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS amenities JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS amenities JSONB NOT NULL DEFAULT '[]'::jsonb;
