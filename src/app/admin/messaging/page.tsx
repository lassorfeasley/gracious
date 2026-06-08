import Link from 'next/link';
import { Mail, MessageSquare, Clock, ChevronRight } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSiteAdmin } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/dates';
import {
  AUTOMATED_MESSAGES,
  ALL_LOG_TYPES,
  messageForLogType,
  type AutomatedMessage,
  type MessageCategory,
} from '@/lib/messaging/registry';

export const metadata = { title: 'Messaging · Admin' };

const CATEGORY_ORDER: MessageCategory[] = [
  'Invitations',
  'Booking requests',
  'Confirmations',
  'Reminders',
];

interface MessageStats {
  count30d: number;
  lastSent: string | null;
}

export default async function AdminMessagingPage() {
  await requireSiteAdmin();
  const admin = createAdminClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: logs } = await admin
    .from('notifications_log')
    .select('type, created_at')
    .in('type', ALL_LOG_TYPES)
    .gte('created_at', since.toISOString());

  const statsByMessage = new Map<string, MessageStats>();
  for (const log of logs ?? []) {
    const message = messageForLogType(log.type);
    if (!message) continue;
    const existing = statsByMessage.get(message.id) ?? {
      count30d: 0,
      lastSent: null,
    };
    existing.count30d += 1;
    if (!existing.lastSent || log.created_at > existing.lastSent) {
      existing.lastSent = log.created_at;
    }
    statsByMessage.set(message.id, existing);
  }

  const grouped = CATEGORY_ORDER.map((category) => ({
    category,
    messages: AUTOMATED_MESSAGES.filter((m) => m.category === category),
  })).filter((g) => g.messages.length > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messaging</h1>
        <p className="mt-1 text-muted-foreground">
          Every automated message the platform sends — what goes out, who
          receives it, when, and the exact content.
        </p>
      </div>

      {grouped.map(({ category, messages }) => (
        <section key={category} className="space-y-3">
          <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            {category}
          </h2>
          <div className="overflow-hidden rounded-xl border divide-y">
            {messages.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                stats={statsByMessage.get(message.id)}
              />
            ))}
          </div>
        </section>
      ))}

      <section className="rounded-xl border border-dashed bg-muted/20 p-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-medium">SMS / text messages</h2>
          <Badge variant="secondary" className="text-[11px]">
            Planned
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          No SMS provider is connected yet. When text messaging is added, those
          automations will appear here alongside email so you can manage both
          channels in one place.
        </p>
      </section>
    </div>
  );
}

function MessageRow({
  message,
  stats,
}: {
  message: AutomatedMessage;
  stats?: MessageStats;
}) {
  const Icon = message.channel === 'sms' ? MessageSquare : Mail;

  return (
    <Link
      href={`/admin/messaging/${message.id}`}
      className="flex items-center gap-4 px-4 py-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{message.name}</span>
          {message.variants.length > 1 && (
            <Badge variant="secondary" className="text-[11px]">
              {message.variants.length} variants
            </Badge>
          )}
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {message.description}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>To: {message.audience}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {message.timing}
          </span>
        </div>
      </div>

      <div className="hidden shrink-0 text-right sm:block">
        {message.logTypes.length === 0 ? (
          <p className="text-xs text-muted-foreground">Not tracked</p>
        ) : (
          <>
            <p className="text-sm font-medium tabular-nums">
              {stats?.count30d ?? 0}
            </p>
            <p className="text-xs text-muted-foreground">
              {stats?.lastSent
                ? `last ${formatDate(stats.lastSent)}`
                : 'none in 30d'}
            </p>
          </>
        )}
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
