-- Room images gallery + featured flag on property images

ALTER TABLE public.property_images
  ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT false;

-- Room images (mirrors property_images)
CREATE TABLE public.room_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT,
  display_order INT NOT NULL DEFAULT 0,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_room_images_room ON public.room_images(room_id);

ALTER TABLE public.room_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY room_images_all ON public.room_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms r
      WHERE r.id = room_id AND public.can_manage_property(r.property_id)
    )
  );
