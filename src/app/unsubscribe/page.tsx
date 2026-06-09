import { createAdminClient } from '@/lib/supabase/admin';
import { parseUnsubscribeToken } from '@/lib/unsubscribe';
import {
  CATEGORY_LABELS,
  isSubscribedToCategory,
  normalizePrefs,
} from '@/lib/notification-prefs';
import { UnsubscribeControl } from '@/components/unsubscribe-control';

export const metadata = { title: 'Email preferences · GuestHouse' };

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const parsed = token ? parseUnsubscribeToken(token) : null;

  let initialSubscribed = true;
  if (parsed) {
    const admin = createAdminClient();
    const { data: user } = await admin
      .from('users')
      .select('notification_prefs')
      .eq('id', parsed.userId)
      .maybeSingle();
    if (user) {
      initialSubscribed = isSubscribedToCategory(
        normalizePrefs(user.notification_prefs),
        parsed.category
      );
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border bg-card p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          GuestHouse
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Email preferences
        </h1>

        <div className="mt-6">
          {parsed ? (
            <UnsubscribeControl
              token={token!}
              categoryLabel={CATEGORY_LABELS[parsed.category]}
              initialSubscribed={initialSubscribed}
            />
          ) : (
            <p className="text-muted-foreground">
              This unsubscribe link is invalid or has expired. You can manage all
              your email preferences from your account settings.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
