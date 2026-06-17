-- Platform legal documents (Terms of Service, Privacy Policy).
-- Public read via RLS; writes go through the admin API (service role).

CREATE TABLE public.site_documents (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT site_documents_slug_check CHECK (slug IN ('terms', 'privacy'))
);

INSERT INTO public.site_documents (slug, title, body) VALUES
  (
    'terms',
    'Terms of Service',
    E'Welcome to Gracious. These Terms of Service govern your use of the Gracious platform.\n\nBy creating an account or using Gracious, you agree to these terms. If you do not agree, please do not use the service.\n\nHosts are responsible for the accuracy of property information they publish and for honoring confirmed guest stays. Guests are responsible for respecting house rules and communicating in good faith.\n\nGracious is provided as-is. We may update these terms from time to time; continued use after changes constitutes acceptance.\n\nContact us with questions about these terms.'
  ),
  (
    'privacy',
    'Privacy Policy',
    E'This Privacy Policy describes how Gracious collects, uses, and protects your information.\n\nWe collect account information (such as your name and email), property and booking data you provide as a host or guest, and standard usage data needed to operate the service.\n\nWe use this information to provide hosting and guest features, send transactional emails (such as invitations and stay updates), and improve the product.\n\nWe do not sell your personal information. We share data only with service providers necessary to run Gracious (for example, email delivery and payment processing) or when required by law.\n\nYou may request access to or deletion of your account data by contacting us.\n\nWe may update this policy from time to time. Material changes will be reflected on this page.'
  );

ALTER TABLE public.site_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_documents_select ON public.site_documents
  FOR SELECT TO anon, authenticated
  USING (true);
