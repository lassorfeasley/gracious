'use client';

import { useEffect, useRef } from 'react';
import { consumePendingUpgrade, startCheckout } from '@/lib/billing-client';

/**
 * Picks up "go Pro now" intent captured during signup and launches Stripe
 * checkout once the owner lands in the dashboard (where a session exists).
 * Renders nothing; runs once per stored intent.
 */
export function PendingUpgradeCheckout() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const interval = consumePendingUpgrade();
    if (interval) {
      void startCheckout(interval, '/dashboard');
    }
  }, []);

  return null;
}
