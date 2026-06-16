-- Email outbox: a durable queue so transactional emails are never lost.
--
-- Notification code enqueues a fully-rendered message here (HTML already built)
-- instead of calling the provider inline. A worker delivers it out-of-band with
-- retries and exponential backoff:
--   * best-effort: an after() hook drains right after the originating request, so
--     mail still feels instant in the common case;
--   * safety net: a per-minute cron (/api/cron/email-outbox) retries anything the
--     after() hook missed or that failed transiently.
--
-- Latency-sensitive auth/magic-link mail stays SYNCHRONOUS and does NOT use this
-- table (a queued sign-in link could arrive a minute late).

CREATE TABLE public.email_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- pending: due for delivery | sending: claimed by a worker
  -- sent: delivered to provider | failed: gave up after max_attempts (dead letter)
  status TEXT NOT NULL DEFAULT 'pending',
  to_addresses TEXT[] NOT NULL,
  from_address TEXT NOT NULL,
  reply_to TEXT,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  headers JSONB,
  -- [{ filename, content }] where content is base64 (e.g. .ics invites)
  attachments JSONB,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  provider_message_id TEXT,
  -- optional caller-supplied key to make enqueues idempotent
  idempotency_key TEXT,
  CONSTRAINT email_outbox_status_check
    CHECK (status IN ('pending', 'sending', 'sent', 'failed'))
);

-- Worker scan path: due rows that still need work, oldest deadline first.
CREATE INDEX idx_email_outbox_due ON public.email_outbox (next_attempt_at)
  WHERE status IN ('pending', 'sending');

-- Dedupe enqueues when a caller supplies an idempotency key.
CREATE UNIQUE INDEX idx_email_outbox_idempotency
  ON public.email_outbox (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Rows contain rendered email bodies (PII). RLS on with NO policies blocks anon
-- and authenticated roles entirely; the service role (used by the workers)
-- bypasses RLS.
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

-- Atomically claim a batch for delivery. Flips rows to 'sending' and bumps the
-- attempt counter under FOR UPDATE SKIP LOCKED, so the after() hook and the cron
-- can run concurrently without ever double-sending. Also reclaims rows stuck in
-- 'sending' for >10 minutes (a worker that crashed mid-delivery).
CREATE OR REPLACE FUNCTION public.claim_email_outbox(batch_size INT)
RETURNS SETOF public.email_outbox
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.email_outbox o
  SET status = 'sending',
      attempts = o.attempts + 1,
      updated_at = now()
  WHERE o.id IN (
    SELECT c.id FROM public.email_outbox c
    WHERE (c.status = 'pending' AND c.next_attempt_at <= now())
       OR (c.status = 'sending' AND c.updated_at < now() - interval '10 minutes')
    ORDER BY c.next_attempt_at
    LIMIT GREATEST(batch_size, 1)
    FOR UPDATE SKIP LOCKED
  )
  RETURNING o.*;
END;
$$;

-- Only the service role may claim; never expose this over the public API.
REVOKE ALL ON FUNCTION public.claim_email_outbox(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_email_outbox(INT) TO service_role;
