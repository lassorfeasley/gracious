import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCurrentUser, userManagesAnyProperty } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { appUrl } from '@/lib/env';
import {
  getStripe,
  isStripeConfigured,
  resolvePriceIdByLookupKey,
} from '@/lib/stripe';
import { STRIPE_PRICE_LOOKUP_KEYS, type BillingInterval } from '@/lib/pricing';

const checkoutSchema = z.object({
  interval: z.enum(['annual', 'monthly']),
  returnPath: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Billing is not configured yet' },
        { status: 503 }
      );
    }

    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Pro is a hosting plan, so only hosts (people who own/manage a property)
    // can subscribe.
    if (!(await userManagesAnyProperty(user.id))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const interval = parsed.data.interval as BillingInterval;
    const lookupKey = STRIPE_PRICE_LOOKUP_KEYS[interval];
    const priceId = await resolvePriceIdByLookupKey(lookupKey);
    if (!priceId) {
      return NextResponse.json(
        {
          error: `No active Stripe price found for ${interval} billing (lookup key "${lookupKey}")`,
        },
        { status: 503 }
      );
    }

    const admin = createAdminClient();
    const stripe = getStripe();
    const baseUrl = appUrl();
    const returnPath = parsed.data.returnPath ?? '/dashboard';

    let customerId = user.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      await admin
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}${returnPath}?checkout=success`,
      cancel_url: `${baseUrl}${returnPath}?checkout=cancelled`,
      metadata: { userId: user.id },
      subscription_data: {
        metadata: { userId: user.id },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
