import { NextRequest, NextResponse } from 'next/server';
import { drainEmailOutbox } from '@/lib/email/outbox';

/** Hard cap on batches per invocation so we never approach the function timeout. */
const MAX_ROUNDS = 20;

/**
 * Safety-net drainer for the email outbox. The `after()` hook on `enqueueEmail`
 * delivers most mail right after the originating request; this endpoint retries
 * anything that was skipped or failed transiently, and clears any backlog in
 * bounded batches.
 *
 * On Vercel Hobby, cron jobs only fire once per day, so this is wired as:
 *   - a daily Vercel cron (guaranteed backstop, see vercel.json), and
 *   - a free GitHub Actions schedule that pings this endpoint every ~5 min
 *     (.github/workflows/email-outbox.yml) for timely retries.
 * Both authenticate with CRON_SECRET. Upgrade the Vercel schedule to per-minute
 * once on Pro and the Action becomes optional.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let sent = 0;
  let retried = 0;
  let failed = 0;
  let rounds = 0;

  for (; rounds < MAX_ROUNDS; rounds++) {
    const result = await drainEmailOutbox();
    sent += result.sent;
    retried += result.retried;
    failed += result.failed;
    if (result.claimed === 0) break;
  }

  return NextResponse.json({ ok: true, sent, retried, failed, rounds });
}
