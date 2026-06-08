import Link from 'next/link';
import { Building2, Check, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PRICING_PLANS, type PlanIcon } from '@/lib/pricing';

const PLAN_ICONS: Record<PlanIcon, typeof Home> = {
  home: Home,
  building: Building2,
};

export function PricingCards({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'mx-auto grid max-w-4xl gap-6 text-left sm:grid-cols-2',
        className
      )}
    >
      {PRICING_PLANS.map((plan) => {
        const Icon = PLAN_ICONS[plan.icon];
        return (
          <div
            key={plan.id}
            className={cn(
              'relative flex flex-col rounded-2xl border bg-card p-8 shadow-sm',
              plan.recommended && 'border-primary ring-1 ring-primary'
            )}
          >
            {plan.recommended && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Recommended
              </span>
            )}

            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="size-5" />
              <span className="text-lg font-semibold text-foreground">
                {plan.name}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-4xl font-semibold tracking-tight">
                {plan.price}
              </span>
              {plan.priceSuffix && (
                <span className="text-sm text-muted-foreground">
                  {plan.priceSuffix}
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.subtext ?? plan.tagline}
            </p>

            <ul className="mt-6 space-y-3 border-t pt-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0 text-green-600" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col gap-2">
              <Button
                asChild
                variant="outline"
                className={cn(
                  'w-full',
                  plan.recommended &&
                    'border-primary text-primary hover:text-primary'
                )}
              >
                <Link href={plan.cta.href}>{plan.cta.label}</Link>
              </Button>
              {plan.ctaNote && (
                <p className="text-center text-xs text-muted-foreground">
                  {plan.ctaNote}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
