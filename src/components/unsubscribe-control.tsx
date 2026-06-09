'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  token: string;
  categoryLabel: string;
  initialSubscribed: boolean;
}

export function UnsubscribeControl({
  token,
  categoryLabel,
  initialSubscribed,
}: Props) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(next: boolean) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/unsubscribe?token=${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subscribed: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? 'Something went wrong');
      }
      setSubscribed(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {subscribed ? (
        <>
          <p className="text-muted-foreground">
            You&apos;re currently subscribed to{' '}
            <strong className="text-foreground">{categoryLabel}</strong>.
          </p>
          <Button onClick={() => update(false)} disabled={loading}>
            {loading ? 'Updating…' : `Unsubscribe from ${categoryLabel}`}
          </Button>
        </>
      ) : (
        <>
          <p className="text-muted-foreground">
            You&apos;ve been unsubscribed from{' '}
            <strong className="text-foreground">{categoryLabel}</strong>. You
            won&apos;t receive these emails anymore.
          </p>
          <Button
            variant="outline"
            onClick={() => update(true)}
            disabled={loading}
          >
            {loading ? 'Updating…' : 'Resubscribe'}
          </Button>
        </>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">
        Note: essential emails (sign-in, invitations, and booking confirmations)
        are always sent and can&apos;t be turned off.
      </p>
    </div>
  );
}
