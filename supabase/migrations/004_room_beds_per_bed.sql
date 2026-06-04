-- Move from a single bed_size per room to a list of beds, each with its own size.
-- `beds` is a JSONB array of size strings, e.g. ["king", "twin", "twin"].
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS beds JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Backfill from the older bed_count/bed_size columns when they still exist,
-- then drop them. Guarded so this runs cleanly whether or not 003 was applied.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'rooms'
      AND column_name = 'bed_count'
  ) THEN
    UPDATE public.rooms r
    SET beds = to_jsonb(
      array_fill(COALESCE(r.bed_size, 'queen'), ARRAY[GREATEST(r.bed_count, 1)])
    )
    WHERE r.beds = '[]'::jsonb;

    ALTER TABLE public.rooms DROP COLUMN bed_count;
    ALTER TABLE public.rooms DROP COLUMN IF EXISTS bed_size;
  END IF;
END $$;
