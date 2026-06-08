import Link from 'next/link';
import { notFound } from 'next/navigation';
import { render } from '@react-email/components';
import { ArrowLeft, Mail, MessageSquare } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSiteAdmin } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { EmailPreview } from '@/components/admin/email-preview';
import { formatDate } from '@/lib/dates';
import { getMessage } from '@/lib/messaging/registry';

export default async function AdminMessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSiteAdmin();
  const { id } = await params;
  const message = getMessage(id);
  if (!message) notFound();

  const admin = createAdminClient();

  const renderedVariants = await Promise.all(
    message.variants.map(async (v) => ({
      label: v.label,
      subject: v.subject,
      html: await render(v.element),
    }))
  );

  let recentSends:
    | { type: string; created_at: string }[]
    | null = null;
  if (message.logTypes.length > 0) {
    const { data } = await admin
      .from('notifications_log')
      .select('type, created_at')
      .in('type', message.logTypes)
      .order('created_at', { ascending: false })
      .limit(20);
    recentSends = data ?? [];
  }

  const Icon = message.channel === 'sms' ? MessageSquare : Mail;

  const details: { label: string; value: React.ReactNode }[] = [
    { label: 'Channel', value: message.channel === 'sms' ? 'SMS' : 'Email' },
    { label: 'Audience', value: message.audience },
    { label: 'Trigger', value: message.trigger },
    { label: 'Timing', value: message.timing },
    {
      label: 'Can be muted by',
      value: message.notificationPref ? (
        <span className="inline-flex items-center gap-2">
          {message.notificationPref.label} preference
          {!message.notificationPref.enforced && (
            <Badge variant="secondary" className="text-[11px]">
              not yet enforced
            </Badge>
          )}
        </span>
      ) : (
        'Not muteable (always sent)'
      ),
    },
    {
      label: 'Delivery tracking',
      value:
        message.logTypes.length > 0 ? (
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            {message.logTypes.join(', ')}
          </code>
        ) : (
          'Not logged'
        ),
    },
    {
      label: 'Triggered from',
      value: (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
          {message.source}
        </code>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/messaging"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All messages
        </Link>

        <div className="mt-3 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {message.name}
            </h1>
            <p className="mt-1 text-muted-foreground">{message.description}</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border">
        <dl className="divide-y text-sm">
          {details.map((d) => (
            <div
              key={d.label}
              className="grid grid-cols-1 gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4"
            >
              <dt className="font-medium text-muted-foreground">{d.label}</dt>
              <dd>{d.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Content preview
        </h2>
        <EmailPreview variants={renderedVariants} />
      </section>

      {recentSends && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Recent sends
          </h2>
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="px-4 py-3 font-medium">Sent</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {recentSends.map((s, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      {formatDate(s.created_at, 'MMM d, yyyy · h:mm a')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <code className="text-xs">{s.type}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentSends.length === 0 && (
              <p className="p-8 text-center text-muted-foreground">
                No sends recorded yet.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
