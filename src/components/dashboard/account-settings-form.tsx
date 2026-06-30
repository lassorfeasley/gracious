'use client';

import { useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { normalizePrefs } from '@/lib/notification-prefs';
import { AvatarUploader } from '@/components/dashboard/avatar-uploader';
import { formatPersonName } from '@/lib/names';
import type { NotificationPrefs, User } from '@/types/database';

interface AccountSettingsFormProps {
  user: User;
  /** Whether the person hosts any home (owns or co-manages). Gates host-only
   * email preferences, which are irrelevant to pure guests. */
  isHost: boolean;
}

export function AccountSettingsForm({ user, isHost }: AccountSettingsFormProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(
    normalizePrefs(user.notification_prefs)
  );
  const [loading, setLoading] = useState(false);

  async function savePrefs() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({ notification_prefs: prefs })
      .eq('id', user.id);
    setLoading(false);
    if (error) toast.error(error.message);
    else toast.success('Preferences saved');
  }

  return (
    <>
      <section className="py-8">
        <h2 className="text-lg font-medium">Your profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your photo appears next to your name across Gracious.
        </p>
        <div className="mt-6">
          <AvatarUploader
            userId={user.id}
            name={formatPersonName(user, user.email) ?? user.email}
            email={user.email}
            avatarUrl={user.avatar_url}
          />
        </div>
      </section>

      <section className="py-8">
        <h2 className="text-lg font-medium">Email preferences</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose which emails you receive from Gracious.
        </p>
        <div className="mt-6 space-y-8">
          <PrefGroup
            title="Guest emails"
            description="For visits you're a guest on — visit reminders, checkout details, and post-visit notes. Essential emails like visit confirmations are always sent."
          >
            <PrefToggle
              prefs={prefs}
              setPrefs={setPrefs}
              prefKey="guest_reminders"
              label="Visit reminders & follow-ups"
            />
          </PrefGroup>

          {isHost && (
            <>
              <PrefGroup
                title="Host emails"
                description="Activity and tips for homes you host."
              >
                {(
                  [
                    ['visit_requests', 'New visit requests'],
                    ['visit_cancelled', 'Visit cancellations'],
                    ['invitation_expiring', 'Invitations expiring soon'],
                    ['invitation_stalled', 'Invites that went quiet'],
                    ['host_tips', 'Hosting tips & suggestions'],
                  ] as const
                ).map(([key, label]) => (
                  <PrefToggle
                    key={key}
                    prefs={prefs}
                    setPrefs={setPrefs}
                    prefKey={key}
                    label={label}
                  />
                ))}
              </PrefGroup>

              <PrefGroup
                title="Account emails"
                description="News about Gracious itself. Marketing only — opt out anytime."
              >
                <PrefToggle
                  prefs={prefs}
                  setPrefs={setPrefs}
                  prefKey="product_updates"
                  label="Product updates & announcements"
                />
              </PrefGroup>
            </>
          )}

          <Button onClick={savePrefs} disabled={loading}>
            Save preferences
          </Button>
        </div>
      </section>
    </>
  );
}

function PrefGroup({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function PrefToggle({
  prefs,
  setPrefs,
  prefKey,
  label,
}: {
  prefs: NotificationPrefs;
  setPrefs: (prefs: NotificationPrefs) => void;
  prefKey: keyof NotificationPrefs;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <Label htmlFor={prefKey}>{label}</Label>
      <Switch
        id={prefKey}
        checked={prefs[prefKey]}
        onCheckedChange={(v) => setPrefs({ ...prefs, [prefKey]: v })}
      />
    </div>
  );
}
