-- Add bed details to rooms
ALTER TABLE public.rooms
  ADD COLUMN IF NOT EXISTS bed_count INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bed_size TEXT;

ALTER TABLE public.rooms
  ADD CONSTRAINT rooms_bed_count_positive CHECK (bed_count >= 1);
