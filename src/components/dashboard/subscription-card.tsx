'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { PRICING_PLANS, type PlanId } from '@/lib/pricing';

interface SubscriptionCardProps {
  currentPlan: PlanId;
}

export function SubscriptionCard({ currentPlan }: SubscriptionCardProps) {
  const [interval, setInterval] = useState<'annual' | 'monthly'>('annual');
  const pro = PRICING_PLANS.find((p) => p.id === 'pro')!;
  const isPro = currentPlan === 'pro';

  function handleUpgrade() {
    // TODO: redirect to Stripe Checkout for the selected interval.
    toast.info('Billing isn’t connected yet — Stripe checkout is coming soon.');
  }

  function handleManage() {
    // TODO: redirect to the Stripe customer billing portal.
    toast.info('Billing portal is coming soon.');
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Subscription</CardTitle>
          <Badge variant={isPro ? 'default' : 'secondary'}>
            {isPro ? 'Pro' : 'Free'} plan
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {isPro ? (
          <>
            <p className="text-sm text-muted-foreground">
              You’re on the <strong>Pro</strong> plan with unlimited homes,
              rooms, and co-managers.
            </p>
            <Button variant="outline" onClick={handleManage}>
              Manage billing
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              You’re on the <strong>Free</strong> plan — one home, with the full
              guest experience. Upgrade to Pro to add more homes and co-managers.
            </p>

            <div className="rounded-xl border p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">Pro</p>
                  <p className="text-sm text-muted-foreground">
                    {interval === 'annual'
                      ? 'Billed $390 / year'
                      : 'Billed $39 / month'}
                  </p>
                </div>
                <div className="inline-flex rounded-lg border p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setInterval('annual')}
                    className={cn(
                      'rounded-md px-3 py-1.5 font-medium transition-colors',
                      interval === 'annual'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Annual
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterval('monthly')}
                    className={cn(
                      'rounded-md px-3 py-1.5 font-medium transition-colors',
                      interval === 'monthly'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              <ul className="mt-4 space-y-2">
                {pro.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm"
                  >
                    <Check className="size-4 shrink-0 text-green-600" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Button className="mt-5 w-full" onClick={handleUpgrade}>
                {interval === 'annual'
                  ? 'Start 30-day free trial'
                  : 'Upgrade to Pro'}
              </Button>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                {pro.ctaNote}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
