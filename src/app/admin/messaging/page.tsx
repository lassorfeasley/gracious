import Link from 'next/link';
import { Mail, MessageSquare, Clock, ChevronRight } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSiteAdmin } from '@/lib/auth';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/dates';
import { MessagingTabs, type MessagingTab } from '@/components/admin/messaging-tabs';
import {
  ALL_LOG_TYPES,
  GUEST_JOURNEY,
  HOST_JOURNEY,
  ACCOUNT_JOURNEY,
  getMessage,
  messageForLogType,
  messagesForRecipient,
  type AutomatedMessage,
  type JourneyStep,
} from '@/lib/messaging/registry';

export const metadata = { title: 'Messaging · Admin' };

interface MessageStats {
  count30d: number;
  lastSent: string | null;
}

type StatsMap = Map<string, MessageStats>;

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

  const statsByMessage: StatsMap = new Map();
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

  const tabs: MessagingTab[] = [
    {
      value: 'guest',
      label: 'Guest',
      content: (
        <>
          <Journey
            title="Booking journey"
            subtitle="Every email a guest receives, in the order it arrives — from invitation through the morning after they leave."
            steps={GUEST_JOURNEY}
          />
          <MessageList
            heading="All guest emails"
            subtitle="The full set of templates that can reach a guest, regardless of timing."
            messages={messagesForRecipient('guest')}
            statsByMessage={statsByMessage}
          />
        </>
      ),
    },
    {
      value: 'host',
      label: 'Host',
      content: (
        <>
          <Journey
            title="Booking journey"
            subtitle="The handful of emails a host receives during a booking. Kept deliberately minimal — no digests or roll-ups yet."
            steps={HOST_JOURNEY}
          />
          <MessageList
            heading="All host emails"
            subtitle="Everything that can land in a host's inbox."
            messages={messagesForRecipient('host')}
            statsByMessage={statsByMessage}
          />
        </>
      ),
    },
    {
      value: 'account',
      label: 'Account',
      content: (
        <>
          <Journey
            title="Account & access"
            subtitle="Authentication emails sent by Supabase through our Send Email hook. These fire on the auth event itself, not on a booking timeline."
            steps={ACCOUNT_JOURNEY}
          />
          <MessageList
            heading="All account emails"
            subtitle="Sign-up, sign-in, and password emails for anyone with a login."
            messages={messagesForRecipient('account')}
            statsByMessage={statsByMessage}
          />
        </>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Messaging</h1>
        <p className="mt-1 text-muted-foreground">
          Every automated message the platform sends, organized by who receives
          it. Each flow shows the chronological journey plus the full set of
          templates for that audience.
        </p>
      </div>

      <MessagingTabs tabs={tabs} />

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

function MessageList({
  heading,
  subtitle,
  messages,
  statsByMessage,
}: {
  heading: string;
  subtitle: string;
  messages: AutomatedMessage[];
  statsByMessage: StatsMap;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {heading}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {messages.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No emails for this audience yet.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border divide-y">
          {messages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              stats={statsByMessage.get(message.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function Journey({
  title,
  subtitle,
  steps,
}: {
  title: string;
  subtitle: string;
  steps: JourneyStep[];
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <ol className="relative ml-3 border-l pl-6">
        {steps.map((step, i) => (
          <JourneyRow key={i} index={i + 1} step={step} />
        ))}
      </ol>
    </section>
  );
}

function JourneyRow({ index, step }: { index: number; step: JourneyStep }) {
  const linkedMessages = (step.messageIds ?? [])
    .map((id) => getMessage(id))
    .filter((m): m is AutomatedMessage => Boolean(m));

  return (
    <li className="relative pb-6 last:pb-0">
      <span
        className={`absolute -left-[33px] flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-medium ring-4 ring-background ${
          step.planned
            ? 'bg-muted text-muted-foreground'
            : 'bg-foreground text-background'
        }`}
      >
        {index}
      </span>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{step.title}</span>
        {step.planned && (
          <Badge variant="secondary" className="text-[11px]">
            Planned
          </Badge>
        )}
      </div>

      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        {step.when}
      </p>

      {step.description && (
        <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
      )}

      {linkedMessages.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-2">
          {linkedMessages.map((m) => (
            <Link
              key={m.id}
              href={`/admin/messaging/${m.id}`}
              className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <Mail className="h-3 w-3" />
              {m.name}
            </Link>
          ))}
        </div>
      )}
    </li>
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
