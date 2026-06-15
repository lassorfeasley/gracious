// One-time (idempotent) Stripe setup for Gracious billing.
//
// Creates/ensures everything the app needs to charge for the Pro plan:
//   - A "Gracious Pro" product
//   - Two recurring prices with stable lookup keys the app resolves at runtime:
//       pro_annual  -> $390 / year
//       pro_monthly -> $39 / month
//   - A webhook endpoint pointed at <APP_URL>/api/stripe/webhook subscribed to
//     the three events the app handles
//   - A Customer Billing Portal configuration (required for the /billing/portal route)
//
// Safe to re-run: existing objects are reused, not duplicated.
//
// Usage (test mode):
//   node --env-file=.env.local scripts/stripe-setup.mjs
//
// Usage (LIVE mode) — pass the live key + live app URL explicitly:
//   STRIPE_SECRET_KEY=sk_live_xxx APP_URL=https://gracious.host node scripts/stripe-setup.mjs
//
// The webhook signing secret is only shown by Stripe at creation time — copy it
// from this script's output into STRIPE_WEBHOOK_SECRET.

import Stripe from 'stripe';

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('Missing STRIPE_SECRET_KEY. Set it in your env or .env.local.');
  process.exit(1);
}

const appUrl = (
  process.env.APP_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  'http://localhost:3000'
).replace(/\/$/, '');

const isLive = secretKey.startsWith('sk_live_') || secretKey.startsWith('rk_live_');
const mode = isLive ? 'LIVE' : 'TEST';

const stripe = new Stripe(secretKey, { apiVersion: '2026-05-27.dahlia' });

const PRODUCT_NAME = 'Gracious Pro';
const WEBHOOK_PATH = '/api/stripe/webhook';
const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
];

const PRICES = [
  {
    lookupKey: 'pro_annual',
    unitAmount: 39000, // $390.00
    interval: 'year',
    nickname: 'Pro Annual',
  },
  {
    lookupKey: 'pro_monthly',
    unitAmount: 3900, // $39.00
    interval: 'month',
    nickname: 'Pro Monthly',
  },
];

async function ensureProduct() {
  const search = await stripe.products.search({
    query: `active:'true' AND name:'${PRODUCT_NAME}'`,
    limit: 1,
  });
  if (search.data[0]) {
    console.log(`✓ Product exists: ${search.data[0].id} (${PRODUCT_NAME})`);
    return search.data[0];
  }
  const product = await stripe.products.create({
    name: PRODUCT_NAME,
    description: 'Unlimited hosted stays, homes, rooms, and co-managers.',
  });
  console.log(`+ Created product: ${product.id} (${PRODUCT_NAME})`);
  return product;
}

async function ensurePrice(product, { lookupKey, unitAmount, interval, nickname }) {
  const existing = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1,
  });
  const found = existing.data[0];
  if (found) {
    const matches =
      found.unit_amount === unitAmount &&
      found.recurring?.interval === interval &&
      found.currency === 'usd';
    if (matches) {
      console.log(`✓ Price exists: ${found.id} [${lookupKey}] ${nickname}`);
      return found;
    }
    console.log(
      `! Price for [${lookupKey}] exists (${found.id}) but differs ` +
        `($${(found.unit_amount ?? 0) / 100}/${found.recurring?.interval}). ` +
        `Creating a new price and transferring the lookup key.`
    );
  }

  const price = await stripe.prices.create({
    product: product.id,
    currency: 'usd',
    unit_amount: unitAmount,
    recurring: { interval },
    nickname,
    lookup_key: lookupKey,
    transfer_lookup_key: Boolean(found),
  });
  console.log(
    `+ Created price: ${price.id} [${lookupKey}] ${nickname} ` +
      `($${unitAmount / 100}/${interval})`
  );
  return price;
}

function isPublicUrl(url) {
  return !/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])/i.test(url);
}

async function ensureWebhook() {
  const url = `${appUrl}${WEBHOOK_PATH}`;

  if (!isPublicUrl(appUrl)) {
    console.log(
      `– Skipping webhook for non-public URL (${appUrl}). For local dev, run:\n` +
        '    stripe listen --forward-to localhost:3000/api/stripe/webhook\n' +
        '  and use the whsec_... it prints as STRIPE_WEBHOOK_SECRET.'
    );
    return null;
  }

  const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
  const existing = endpoints.data.find((e) => e.url === url);

  if (existing) {
    const current = new Set(existing.enabled_events);
    const missing = WEBHOOK_EVENTS.filter((e) => !current.has(e));
    if (missing.length || existing.status !== 'enabled') {
      await stripe.webhookEndpoints.update(existing.id, {
        enabled_events: Array.from(new Set([...existing.enabled_events, ...WEBHOOK_EVENTS])),
        disabled: false,
      });
      console.log(`~ Updated webhook events on ${existing.id} -> ${url}`);
    } else {
      console.log(`✓ Webhook exists: ${existing.id} -> ${url}`);
    }
    console.log(
      '  NOTE: The signing secret is only revealed at creation. If you do not ' +
        'have STRIPE_WEBHOOK_SECRET saved, roll it in the Dashboard (Developers → ' +
        'Webhooks → this endpoint → "Roll secret") and use the new value.'
    );
    return existing;
  }

  const endpoint = await stripe.webhookEndpoints.create({
    url,
    enabled_events: WEBHOOK_EVENTS,
    description: 'Gracious — subscription lifecycle',
  });
  console.log(`+ Created webhook: ${endpoint.id} -> ${url}`);
  console.log('');
  console.log('  ┌─────────────────────────────────────────────────────────────');
  console.log('  │ STRIPE_WEBHOOK_SECRET (copy this into Vercel / .env):');
  console.log(`  │   ${endpoint.secret}`);
  console.log('  └─────────────────────────────────────────────────────────────');
  console.log('');
  return endpoint;
}

async function ensurePortalConfig() {
  const configs = await stripe.billingPortal.configurations.list({ limit: 1 });
  if (configs.data[0]) {
    console.log(`✓ Billing portal configured: ${configs.data[0].id}`);
    return configs.data[0];
  }
  const config = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: 'Manage your Gracious subscription',
    },
    features: {
      customer_update: { enabled: true, allowed_updates: ['email', 'name', 'address'] },
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: 'at_period_end' },
    },
  });
  console.log(`+ Created billing portal configuration: ${config.id}`);
  return config;
}

async function main() {
  console.log(`\nStripe setup — ${mode} mode`);
  console.log(`App URL: ${appUrl}\n`);

  if (isLive) {
    console.log('⚠️  Running against a LIVE key. Real objects will be created.\n');
  }

  const product = await ensureProduct();
  for (const p of PRICES) {
    await ensurePrice(product, p);
  }
  await ensureWebhook();
  await ensurePortalConfig();

  console.log('\nDone. Next: ensure STRIPE_SECRET_KEY + STRIPE_WEBHOOK_SECRET are set');
  console.log('in your production environment, then redeploy.\n');
}

main().catch((err) => {
  console.error('\nSetup failed:', err.message);
  process.exit(1);
});
