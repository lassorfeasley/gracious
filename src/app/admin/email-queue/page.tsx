import { revalidatePath } from 'next/cache';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSiteAdmin } from '@/lib/auth';
import { drainEmailOutbox } from '@/lib/email/outbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Email queue · Admin' };

// Always read fresh — the queue changes constantly as mail drains.
export const dynamic = 'force-dynamic';

type OutboxStatus = 'pending' | 'sending' | 'sent' | 'failed';
const STATUSES: OutboxStatus[] = ['pending', 'sending', 'sent', 'failed'];

const statusVariant: Record<
  OutboxStatus,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  sending: 'secondary',
  sent: 'default',
  failed: 'destructive',
};

interface OutboxRow {
  id: string;
  status: OutboxStatus;
  to_addresses: string[];
  subject: string;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  next_attempt_at: string;
  created_at: string;
  sent_at: string | null;
  provider_message_id: string | null;
}

function formatWhen(value: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

async function drainNow() {
  'use server';
  await requireSiteAdmin();
  await drainEmailOutbox();
  revalidatePath('/admin/email-queue');
}

async function retryEmail(formData: FormData) {
  'use server';
  await requireSiteAdmin();
  const id = formData.get('id');
  if (typeof id !== 'string') return;

  const admin = createAdminClient();
  // Re-arm the row so the next drain picks it up immediately.
  await admin
    .from('email_outbox')
    .update({
      status: 'pending',
      next_attempt_at: new Date().toISOString(),
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  await drainEmailOutbox();
  revalidatePath('/admin/email-queue');
}

export default async function AdminEmailQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeFilter = STATUSES.includes(status as OutboxStatus)
    ? (status as OutboxStatus)
    : null;

  const admin = createAdminClient();

  const counts = Object.fromEntries(
    await Promise.all(
      STATUSES.map(async (s) => {
        const { count } = await admin
          .from('email_outbox')
          .select('id', { count: 'exact', head: true })
          .eq('status', s);
        return [s, count ?? 0] as const;
      })
    )
  ) as Record<OutboxStatus, number>;

  const total = STATUSES.reduce((sum, s) => sum + counts[s], 0);

  let query = admin
    .from('email_outbox')
    .select(
      'id, status, to_addresses, subject, attempts, max_attempts, last_error, next_attempt_at, created_at, sent_at, provider_message_id'
    )
    .order('created_at', { ascending: false })
    .limit(200);

  if (activeFilter) query = query.eq('status', activeFilter);

  const { data } = await query;
  const rows = (data ?? []) as OutboxRow[];

  const tabs: { key: OutboxStatus | null; label: string; count: number }[] = [
    { key: null, label: 'All', count: total },
    ...STATUSES.map((s) => ({ key: s, label: s, count: counts[s] })),
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Email queue</h1>
          <p className="mt-1 text-muted-foreground">
            The <code>email_outbox</code> table — transactional mail waiting to
            send, sent, or dead-lettered.
          </p>
        </div>
        <form action={drainNow}>
          <Button type="submit" variant="outline">
            Drain queue now
          </Button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const href = tab.key
            ? `/admin/email-queue?status=${tab.key}`
            : '/admin/email-queue';
          const isActive = activeFilter === tab.key;
          return (
            <Link
              key={tab.label}
              href={href}
              className={
                isActive
                  ? 'rounded-full bg-foreground px-3 py-1.5 text-sm font-medium capitalize text-background'
                  : 'rounded-full border px-3 py-1.5 text-sm font-medium capitalize text-muted-foreground transition-colors hover:text-foreground'
              }
            >
              {tab.label}{' '}
              <span className={isActive ? 'opacity-80' : 'opacity-60'}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Subject</th>
              <th className="px-4 py-3 font-medium">To</th>
              <th className="px-4 py-3 font-medium">Attempts</th>
              <th className="px-4 py-3 font-medium">Next / sent</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const canRetry =
                row.status === 'failed' || row.status === 'pending';
              return (
                <tr key={row.id} className="border-b align-top last:border-0">
                  <td className="px-4 py-3">
                    <Badge variant={statusVariant[row.status]}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{row.subject}</div>
                    {row.last_error && (
                      <div className="mt-1 max-w-md text-xs text-destructive">
                        {row.last_error}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.to_addresses.join(', ')}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.attempts}/{row.max_attempts}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.status === 'sent'
                      ? formatWhen(row.sent_at)
                      : formatWhen(row.next_attempt_at)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatWhen(row.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {canRetry && (
                      <form action={retryEmail}>
                        <input type="hidden" name="id" value={row.id} />
                        <Button type="submit" size="sm" variant="ghost">
                          Retry
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="p-8 text-center text-muted-foreground">
            {activeFilter
              ? `No ${activeFilter} emails.`
              : 'The queue is empty.'}
          </p>
        )}
      </div>
    </div>
  );
}
