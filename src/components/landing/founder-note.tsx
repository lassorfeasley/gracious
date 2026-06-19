import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function FounderNote({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto max-w-2xl', className)}>
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-brass">
          A note from the founder
        </p>
      </div>

      <div className="mt-10 space-y-6 text-lg leading-relaxed text-muted-foreground">
        <p>
          Opening your home to the people you love should be one of life&apos;s
          simple pleasures. But anyone who hosts more than a few guests knows
          how quickly it stops feeling simple — rounds of email tag over dates,
          the same directions typed out again and again, the gentle reminders
          (no dogs; be out by three; here&apos;s the wifi password).
        </p>
        <p>
          I built Gracious to take those repetitive logistics off your plate, so
          you can spend your attention where it belongs: on creating a memorable
          experience with the people you&apos;ve invited.
        </p>
        <p>
          Whether you have a single spare guestroom or multiple vacation homes,
          I hope Gracious helps you become a more organized and welcoming host.
        </p>
      </div>

      <div className="mt-10 flex items-center gap-4">
        <Image
          src="/brand/founder-lassor.png"
          alt="Lassor Feasley, founder of Gracious"
          width={56}
          height={56}
          className="h-14 w-14 rounded-full object-cover ring-1 ring-border/60"
        />
        <div>
          <p className="text-muted-foreground">Sincerely,</p>
          <p className="font-display text-xl font-semibold tracking-tight text-foreground">
            Lassor Feasley
          </p>
          <p className="text-sm text-muted-foreground">Founder, Gracious</p>
        </div>
      </div>

      <div className="mt-10 border-t border-border/60 pt-10 text-center">
        <Button asChild size="lg">
          <Link href="/signup">Start hosting graciously</Link>
        </Button>
      </div>
    </div>
  );
}
