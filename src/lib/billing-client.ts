'use client';

import { toast } from 'sonner';
import type { BillingInterval } from '@/lib/pricing';

export interface LimitReachedPayload {
  error: 'limit_reached';
  plan: string;
  used: number;
  limit: number;
}

export function isLimitReachedResponse(
  status: number,
  data: unknown
): data is LimitReachedPayload {
  return (
    status === 402 &&
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    (data as LimitReachedPayload).error === 'limit_reached'
  );
}

// Carries "upgrade to Pro" intent from the unauthenticated landing/signup flow
// into the dashboard, where a session cookie exists and checkout can be started.
const PENDING_UPGRADE_KEY = 'gh:pendingUpgrade';

export function storePendingUpgrade(interval: BillingInterval): void {
  try {
    sessionStorage.setItem(PENDING_UPGRADE_KEY, interval);
  } catch {
    // sessionStorage may be unavailable (SSR/private mode); intent is best-effort.
  }
}

export function consumePendingUpgrade(): BillingInterval | null {
  try {
    const value = sessionStorage.getItem(PENDING_UPGRADE_KEY);
    sessionStorage.removeItem(PENDING_UPGRADE_KEY);
    return value === 'annual' || value === 'monthly' ? value : null;
  } catch {
    return null;
  }
}

export async function startCheckout(
  interval: BillingInterval = 'annual',
  returnPath?: string
): Promise<boolean> {
  const res = await fetch('/api/billing/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interval, returnPath }),
  });

  const data = await res.json();

  if (!res.ok) {
    const message =
      typeof data.error === 'string'
        ? data.error
        : 'Could not start checkout';
    toast.error(message);
    return false;
  }

  if (data.url) {
    window.location.href = data.url;
    return true;
  }

  toast.error('Could not start checkout');
  return false;
}

export async function openBillingPortal(returnPath?: string): Promise<boolean> {
  const res = await fetch('/api/billing/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ returnPath }),
  });

  const data = await res.json();

  if (!res.ok) {
    const message =
      typeof data.error === 'string'
        ? data.error
        : 'Could not open billing portal';
    toast.error(message);
    return false;
  }

  if (data.url) {
    window.location.href = data.url;
    return true;
  }

  toast.error('Could not open billing portal');
  return false;
}
