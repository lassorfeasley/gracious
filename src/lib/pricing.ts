export type PlanId = 'free' | 'pro';

export type PlanIcon = 'home' | 'building';

export interface PricingPlan {
  id: PlanId;
  name: string;
  icon: PlanIcon;
  /** Headline price, e.g. "$0" or "$390" */
  price: string;
  /** Suffix shown next to the price, e.g. "/ year" */
  priceSuffix?: string;
  /** Short description under the price */
  tagline: string;
  /** Secondary pricing note, e.g. monthly equivalent */
  subtext?: string;
  features: string[];
  cta: {
    label: string;
    href: string;
  };
  /** Fine print under the CTA */
  ctaNote?: string;
  recommended?: boolean;
}

// Single source of truth for plans. When Stripe is integrated, map each plan
// to its Stripe Price ID here (e.g. add `stripePriceId` fields below).
export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    icon: 'home',
    price: '$0',
    tagline: 'Free forever, for your one home',
    features: [
      'One home',
      'Unlimited rooms, bookings & invites',
      'Full guest experience',
      'iCal export',
    ],
    cta: {
      label: 'Start free',
      href: '/signup',
    },
  },
  {
    id: 'pro',
    name: 'Pro',
    icon: 'building',
    price: '$390',
    priceSuffix: '/ year',
    tagline: 'For hosts with more than one home',
    subtext: 'or $39 / month · save 17% annually',
    features: [
      'Unlimited homes & rooms',
      'Co-managers per property',
      'Everything included, one flat price',
      'No per-booking fees, ever',
    ],
    cta: {
      label: 'Start 30-day free trial',
      href: '/signup',
    },
    ctaNote: "No card to start · keeps your setup if you don't continue",
    recommended: true,
  },
];

export const PRO_ANNUAL_PRICE = '$390 / year';
export const PRO_MONTHLY_PRICE = '$39 / month';
