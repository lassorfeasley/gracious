'use client';

import * as React from 'react';
import {
  Bell,
  Check,
  Heart,
  Home,
  Info,
  Moon,
  Search,
  Sun,
  TriangleAlert,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/* ----------------------------- layout helpers ----------------------------- */

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scroll-mt-24 space-y-5" id={slug(title)}>
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/* -------------------------------- tokens ---------------------------------- */

const SEMANTIC_COLORS = [
  { name: 'background', fg: 'foreground' },
  { name: 'card', fg: 'card-foreground' },
  { name: 'primary', fg: 'primary-foreground' },
  { name: 'brass', fg: 'brass-foreground' },
  { name: 'secondary', fg: 'secondary-foreground' },
  { name: 'muted', fg: 'muted-foreground' },
  { name: 'accent', fg: 'accent-foreground' },
  { name: 'success', fg: 'success-foreground' },
  { name: 'warning', fg: 'warning-foreground' },
  { name: 'destructive', fg: 'destructive-foreground' },
] as const;

/* ------------------------------ brand voice ------------------------------- */

const LEXICON: { use: string; never: string }[] = [
  { use: 'invitation', never: 'listing' },
  { use: 'visit', never: 'booking / reservation / stay' },
  { use: 'arrival', never: 'check-in' },
  { use: 'the house', never: 'the property / the unit' },
  { use: 'having people to stay', never: 'managing guests' },
  { use: 'weeks you are keeping', never: 'blocked availability' },
  { use: 'Get started', never: 'create your account' },
];

const VOICE_SAMPLES = [
  { good: true, text: 'Your invitation is waiting. The house notes are inside.' },
  { good: true, text: 'The Calloways arrive Friday and stay through Sunday.' },
  { good: false, text: 'Manage your listings and availability in one dashboard.' },
  { good: false, text: 'Sign up now to unlock unlimited listings!' },
];

function Swatch({ name, fg }: { name: string; fg: string }) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <div
        className="flex h-20 items-end p-3"
        style={{
          backgroundColor: `hsl(var(--${name}))`,
          color: `hsl(var(--${fg}))`,
        }}
      >
        <span className="text-xs font-medium">Aa</span>
      </div>
      <div className="bg-card px-3 py-2">
        <p className="text-xs font-medium">{name}</p>
        <p className="font-mono text-[10px] text-muted-foreground">
          --{name}
        </p>
      </div>
    </div>
  );
}

const TYPE_SCALE = [
  { label: 'Display', cls: 'font-display text-5xl font-bold tracking-tight' },
  { label: 'Heading 1', cls: 'font-display text-4xl font-bold tracking-tight' },
  { label: 'Heading 2', cls: 'font-display text-3xl font-semibold tracking-tight' },
  { label: 'Heading 3', cls: 'font-display text-2xl font-semibold tracking-tight' },
  { label: 'Heading 4', cls: 'font-display text-xl font-semibold tracking-tight' },
  { label: 'Eyebrow', cls: 'text-xs font-medium uppercase tracking-[0.2em] text-brass' },
  { label: 'Lead', cls: 'text-lg text-muted-foreground' },
  { label: 'Body', cls: 'text-base' },
  { label: 'Small', cls: 'text-sm' },
  { label: 'Caption', cls: 'text-xs text-muted-foreground' },
];

const RADII = [
  { label: 'sm', cls: 'rounded-sm' },
  { label: 'md', cls: 'rounded-md' },
  { label: 'lg', cls: 'rounded-lg' },
  { label: 'xl', cls: 'rounded-xl' },
];
const SHADOWS = [
  { label: 'xs', cls: 'shadow-xs' },
  { label: 'sm', cls: 'shadow-sm' },
  { label: 'md', cls: 'shadow-md' },
  { label: 'lg', cls: 'shadow-lg' },
  { label: 'xl', cls: 'shadow-xl' },
];

/* ----------------------------- brand assets ------------------------------- */

type BrandAsset = {
  name: string;
  /** Path under /public — drop the finished file here and it renders below. */
  file: string;
  format: string;
  size: string;
  surface?: 'light' | 'dark';
  note?: string;
};

const BRAND_ASSET_GROUPS: {
  group: string;
  description: string;
  assets: BrandAsset[];
}[] = [
  {
    group: 'Logo & marks',
    description:
      'Vector masters of the wordmark. Everything else is exported from these.',
    assets: [
      {
        name: 'Wordmark',
        file: 'brand/wordmark.svg',
        format: 'SVG',
        size: 'scalable · ~600×160',
        surface: 'light',
      },
      {
        name: 'Wordmark, reversed',
        file: 'brand/wordmark-reversed.svg',
        format: 'SVG',
        size: 'scalable',
        surface: 'dark',
        note: 'For dark / photo backgrounds',
      },
      {
        name: 'Monogram',
        file: 'brand/logomark.svg',
        format: 'SVG',
        size: 'square · 512×512',
        surface: 'light',
      },
      {
        name: 'Lockup (mark + wordmark)',
        file: 'brand/lockup.svg',
        format: 'SVG',
        size: 'scalable',
        surface: 'light',
      },
    ],
  },
  {
    group: 'Favicon & app icons',
    description:
      'Generated from the monogram. Final files live at the app root; stage them here first.',
    assets: [
      {
        name: 'Favicon (modern)',
        file: 'brand/icon.svg',
        format: 'SVG',
        size: 'scalable',
        surface: 'light',
        note: '→ src/app/icon.svg',
      },
      {
        name: 'Favicon (legacy)',
        file: 'brand/favicon.ico',
        format: 'ICO',
        size: '16 · 32 · 48',
        surface: 'light',
        note: '→ src/app/favicon.ico',
      },
      {
        name: 'Apple touch icon',
        file: 'brand/apple-touch-icon.png',
        format: 'PNG',
        size: '180×180',
        surface: 'light',
        note: '→ src/app/apple-icon.png · no transparency',
      },
      {
        name: 'PWA icon',
        file: 'brand/icon-192.png',
        format: 'PNG',
        size: '192×192',
      },
      {
        name: 'PWA icon, large',
        file: 'brand/icon-512.png',
        format: 'PNG',
        size: '512×512',
      },
      {
        name: 'Maskable icon',
        file: 'brand/icon-maskable-512.png',
        format: 'PNG',
        size: '512×512',
        note: 'Keep art inside center 80% safe area',
      },
      {
        name: 'Safari pinned tab',
        file: 'brand/safari-pinned-tab.svg',
        format: 'SVG, 1-color',
        size: 'scalable',
        surface: 'light',
      },
    ],
  },
  {
    group: 'Social & email',
    description:
      'Raster assets for places that cannot render SVG (link previews, email clients).',
    assets: [
      {
        name: 'Open Graph image',
        file: 'brand/og-default.png',
        format: 'PNG',
        size: '1200×630',
        surface: 'dark',
        note: 'Static fallback for link previews',
      },
      {
        name: 'Email logo',
        file: 'brand/email-logo.png',
        format: 'PNG @2x',
        size: '480×120 (shows 240×60)',
        surface: 'light',
        note: 'Email ignores SVG',
      },
      {
        name: 'Avatar / fallback',
        file: 'brand/avatar-fallback.svg',
        format: 'SVG',
        size: 'square · 256×256',
      },
    ],
  },
];

function AssetTile({ asset }: { asset: BrandAsset }) {
  const [missing, setMissing] = React.useState(false);
  const imgRef = React.useRef<HTMLImageElement>(null);
  const dark = asset.surface === 'dark';

  // An <img> that 404s before React hydrates never fires onError, so also
  // check the load result on mount (naturalWidth is 0 for a failed image).
  React.useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setMissing(true);
  }, []);

  return (
    <div className="overflow-hidden rounded-lg border">
      <div
        className={cn(
          'flex min-h-[132px] items-center justify-center p-6',
          dark ? 'bg-primary' : 'bg-muted/40'
        )}
      >
        {missing ? (
          <div
            className={cn(
              'flex flex-col items-center gap-2 rounded-md border border-dashed px-6 py-5 text-center',
              dark
                ? 'border-primary-foreground/30 text-primary-foreground/70'
                : 'border-muted-foreground/30 text-muted-foreground'
            )}
          >
            <span className="text-xs font-medium uppercase tracking-wider">
              Placeholder
            </span>
            <span className="font-mono text-[10px]">{asset.size}</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={`/${asset.file}`}
            alt={`${asset.name} preview`}
            onError={() => setMissing(true)}
            className="max-h-20 w-auto max-w-full object-contain"
          />
        )}
      </div>
      <div className="space-y-0.5 bg-card px-3 py-2.5">
        <p className="text-sm font-medium">{asset.name}</p>
        <p className="font-mono text-[10px] text-muted-foreground">
          {asset.format} · {asset.size}
        </p>
        <p className="truncate font-mono text-[10px] text-muted-foreground">
          /{asset.file}
        </p>
        {asset.note ? (
          <p className="text-[11px] text-muted-foreground">{asset.note}</p>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------- guide ----------------------------------- */

export function StyleGuide() {
  const [dark, setDark] = React.useState(false);

  // Tailwind v4's @theme resolves --color-* at :root, so dark mode only takes
  // effect when `.dark` is on <html> (matching how next-themes behaves in prod).
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', dark);
    return () => root.classList.remove('dark');
  }, [dark]);

  return (
    <div>
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">
                Gracious — Design System
              </h1>
              <p className="text-xs text-muted-foreground">
                Living style guide · brand, tokens &amp; components
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDark((d) => !d)}
            >
              {dark ? <Sun /> : <Moon />}
              {dark ? 'Light' : 'Dark'}
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-5xl space-y-16 px-6 py-12">
          <Section
            title="Brand"
            description="Gracious sells an identity — being a great host — not software. Hospitality as a practiced art, not a logistics problem."
          >
            <div className="grid gap-6 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Generosity, not commerce
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  The product exists to give visits away. Never borrow language
                  from rental marketplaces — no listings, ratings, or
                  availability management.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Private, not exclusive
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  The absence of a public page isn&apos;t a velvet rope — it&apos;s
                  the discretion of a home. Privacy keeps a visit personal and
                  warm, never a transaction with a stranger. This is about being
                  known for your hospitality, not for being hard to reach.
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    The owner as protagonist
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Airbnb&apos;s hero is the traveler; ours is the host. Every
                  image and sentence is from the host&apos;s vantage point —
                  their table, their porch, their guests arriving.
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section
            title="Voice"
            description="Write like correspondence, not UI copy. Short declarative sentences; slightly formal warmth. The test: could this sentence appear in a well-written house manual?"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Lexicon</CardTitle>
                  <CardDescription>
                    Words we use, and the marketplace register we never do.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y text-sm">
                    {LEXICON.map((row) => (
                      <div
                        key={row.use}
                        className="grid grid-cols-2 gap-4 py-2.5"
                      >
                        <span className="font-medium">{row.use}</span>
                        <span className="text-muted-foreground line-through">
                          {row.never}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">The house-manual test</CardTitle>
                  <CardDescription>
                    Sentences that pass, and sentences that fail.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {VOICE_SAMPLES.map((s) => (
                    <p
                      key={s.text}
                      className={cn(
                        'flex items-start gap-2 text-sm',
                        s.good ? '' : 'text-muted-foreground line-through'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 shrink-0 text-xs font-medium',
                          s.good ? 'text-success' : 'text-destructive'
                        )}
                      >
                        {s.good ? 'PASS' : 'FAIL'}
                      </span>
                      {s.text}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section
            title="Colors"
            description="Paper, ink, pine, brass. A warm ivory ground, near-black ink, deep pine green as the single anchor color, and a restrained brass accent. No blue anywhere — blue reads transactional."
          >
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {SEMANTIC_COLORS.map((c) => (
                <Swatch key={c.name} name={c.name} fg={c.fg} />
              ))}
            </div>
          </Section>

          <Section
            title="Typography"
            description="One typeface throughout: Hanken Grotesk. Hierarchy comes from weight and tight letter-spacing — bold, tight headings against a regular-weight body. Prefer narrower measures and generous whitespace."
          >
            <Card>
              <CardContent className="space-y-4 pt-6">
                {TYPE_SCALE.map((t) => (
                  <div
                    key={t.label}
                    className="flex flex-col gap-1 border-b pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-baseline sm:gap-6"
                  >
                    <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                      {t.label}
                    </span>
                    <span className={t.cls}>The quick brown fox</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </Section>

          <Section
            title="Brand Assets"
            description="Logos, icons, and social/email artwork. Drop a finished file at the /public path shown on each tile and it replaces the placeholder here automatically."
          >
            <div className="space-y-8">
              {BRAND_ASSET_GROUPS.map((g) => (
                <div key={g.group} className="space-y-3">
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight">
                      {g.group}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {g.description}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {g.assets.map((a) => (
                      <AssetTile key={a.file} asset={a} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Radius & Elevation" description="Corner radii scale from the --radius token; shadows are soft and layered.">
            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Radius</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-4">
                  {RADII.map((r) => (
                    <div
                      key={r.label}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className={cn('size-16 border bg-secondary', r.cls)}
                      />
                      <span className="font-mono text-xs text-muted-foreground">
                        {r.label}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Shadow</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-5">
                  {SHADOWS.map((s) => (
                    <div
                      key={s.label}
                      className="flex flex-col items-center gap-2"
                    >
                      <div className={cn('size-16 rounded-lg bg-card', s.cls)} />
                      <span className="font-mono text-xs text-muted-foreground">
                        {s.label}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section title="Buttons" description="All variants and sizes.">
            <Card>
              <CardContent className="space-y-6 pt-6">
                <div className="flex flex-wrap items-center gap-3">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon" aria-label="Like">
                    <Heart />
                  </Button>
                  <Button>
                    <Search />
                    With icon
                  </Button>
                  <Button disabled>Disabled</Button>
                </div>
              </CardContent>
            </Card>
          </Section>

          <Section title="Badges">
            <div className="flex flex-wrap gap-3">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </div>
          </Section>

          <Section title="Form controls">
            <Card>
              <CardContent className="grid gap-6 pt-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sg-name">Name</Label>
                  <Input id="sg-name" placeholder="Jane Doe" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sg-email">Email</Label>
                  <Input id="sg-email" type="email" placeholder="jane@home.co" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="sg-note">Message</Label>
                  <Textarea id="sg-note" placeholder="Tell us about your visit…" />
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="sg-switch" defaultChecked />
                  <Label htmlFor="sg-switch">Enable notifications</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox id="sg-check" defaultChecked />
                  <Label htmlFor="sg-check">I agree to the house rules</Label>
                </div>
              </CardContent>
            </Card>
          </Section>

          <Section title="Cards">
            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>The Lake House</CardTitle>
                  <CardDescription>Tahoe City, California</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Two bedrooms, a private dock, and a wood-burning fireplace.
                  The house notes are by the kettle.
                </CardContent>
                <CardFooter className="justify-between">
                  <span className="text-sm text-muted-foreground">
                    Open the last week of June
                  </span>
                  <Button size="sm">Extend an invitation</Button>
                </CardFooter>
              </Card>
              <Card className="transition-shadow hover:shadow-md">
                <CardHeader>
                  <CardTitle>Hover elevation</CardTitle>
                  <CardDescription>
                    Hover me to see the soft shadow lift.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-2 text-sm text-success">
                  <Check className="size-4" /> The house is free this weekend
                </CardContent>
              </Card>
            </div>
          </Section>

          <Section title="Alerts">
            <div className="space-y-3">
              <Alert>
                <Info />
                <AlertTitle>A note before you arrive</AlertTitle>
                <AlertDescription>
                  Your invitation is good for another seven days.
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertTitle>Payment failed</AlertTitle>
                <AlertDescription>
                  We couldn&apos;t process your subscription renewal.
                </AlertDescription>
              </Alert>
            </div>
          </Section>

          <Section title="Tabs">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">
                  <Home className="size-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="activity">
                  <Bell className="size-4" />
                  Activity
                </TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="pt-4 text-sm text-muted-foreground">
                Overview content lives here.
              </TabsContent>
              <TabsContent value="activity" className="pt-4 text-sm text-muted-foreground">
                Recent activity shows up here.
              </TabsContent>
            </Tabs>
          </Section>

          <Separator />
          <p className="pb-8 text-center text-xs text-muted-foreground">
            Edit tokens in <code className="font-mono">src/app/globals.css</code> —
            every component on this page updates automatically.
          </p>
        </main>
      </div>
    </div>
  );
}
