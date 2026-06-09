import Stripe from 'stripe';
import { getEnv, getEnvOptional } from '@/lib/env';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeClient) {
    stripeClient = new Stripe(getEnv('STRIPE_SECRET_KEY'), {
      apiVersion: '2026-05-27.dahlia',
    });
  }
  return stripeClient;
}

export function getStripeWebhookSecret(): string {
  return getEnv('STRIPE_WEBHOOK_SECRET');
}

export function isStripeConfigured(): boolean {
  return Boolean(getEnvOptional('STRIPE_SECRET_KEY'));
}

const priceIdCache = new Map<string, string>();

/**
 * Resolve a Stripe Price ID from its stable lookup key. Results are cached for
 * the lifetime of the server process. Returns null if no active price carries
 * the given lookup key.
 */
export async function resolvePriceIdByLookupKey(
  lookupKey: string
): Promise<string | null> {
  const cached = priceIdCache.get(lookupKey);
  if (cached) {
    return cached;
  }

  const stripe = getStripe();
  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });

  const priceId = prices.data[0]?.id ?? null;
  if (priceId) {
    priceIdCache.set(lookupKey, priceId);
  }
  return priceId;
}
