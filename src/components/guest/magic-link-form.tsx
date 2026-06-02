'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
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
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?token=${token}`,
      },
    });
    setLoading(false);

    if (error) {
      toast.error(error.message);
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
