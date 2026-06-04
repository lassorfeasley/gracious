-- Offline / host-arranged bookings: lightweight guest contact, no invitation required

ALTER TABLE public.bookings ALTER COLUMN invitation_id DROP NOT NULL;
ALTER TABLE public.bookings ALTER COLUMN guest_user_id DROP NOT NULL;

ALTER TABLE public.bookings
  ADD COLUMN guest_name TEXT,
  ADD COLUMN guest_email TEXT,
  ADD COLUMN guest_phone TEXT,
  ADD COLUMN notify_guest BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN created_by UUID REFERENCES public.users(id);

-- Existing invitation-based bookings should continue receiving guest emails
UPDATE public.bookings SET notify_guest = true WHERE invitation_id IS NOT NULL;

CREATE INDEX idx_bookings_guest_email ON public.bookings(guest_email);
