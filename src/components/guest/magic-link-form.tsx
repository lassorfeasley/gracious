'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MagicLinkFormProps {
  email: string;
  token: string;
}

export function MagicLinkForm({ email, token }: MagicLinkFormProps) {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendLink() {
    setLoading(true);
    const res = await fetch('/api/auth/invite-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(
        typeof data.error === 'string' ? data.error : 'Could not send link'
      );
      return;
    }

    setSent(true);
    toast.success('Check your email for a sign-in link');
  }

  if (sent) {
    return (
      <div className="rounded-lg border bg-muted/50 p-4 text-center text-sm">
        <p className="font-medium">Check your inbox</p>
        <p className="mt-1 text-muted-foreground">
          We sent a magic link to <strong>{email}</strong>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Sign in as <strong>{email}</strong> to continue
      </p>
      <Button onClick={sendLink} className="w-full" disabled={loading}>
        {loading ? 'Sending...' : 'Send magic link'}
      </Button>
    </div>
  );
}
