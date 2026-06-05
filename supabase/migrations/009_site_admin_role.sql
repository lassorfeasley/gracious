-- Site-level administrator role (platform ops, not property host).
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';
