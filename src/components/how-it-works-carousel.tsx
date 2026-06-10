'use client';

import { useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Home,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HostStep {
  title: string;
  description: string;
  icon: LucideIcon;
}

const HOST_STEPS: HostStep[] = [
  {
    title: 'Make the house ready',
    description:
      'Add your rooms, your photographs, and the house notes guests should read before they arrive. Set aside the weeks you are keeping for yourselves.',
    icon: Home,
  },
  {
    title: 'Extend the invitation',
    description:
      'Invitations go to the people you would trust with a key — never a public page. You choose the dates, the rooms, and whether a stay waits for your word.',
    icon: UserPlus,
  },
  {
    title: 'Receive your guests',
    description:
      'The calendar already knows who arrives Friday and who stays through Sunday. Everyone is on the same page before they reach the door.',
    icon: CalendarDays,
  },
];

export function HowItWorksCarousel({ className }: { className?: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  function goTo(index: number) {
    const next = (index + HOST_STEPS.length) % HOST_STEPS.length;
    setActiveIndex(next);
  }

  return (
    <div className={cn('mx-auto max-w-3xl', className)}>
      <div className="relative overflow-hidden p-8 sm:p-10">
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {HOST_STEPS.map((item, index) => {
            const StepIcon = item.icon;
            return (
              <article
                key={item.title}
                className="w-full shrink-0 px-1"
                aria-hidden={index !== activeIndex}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <StepIcon className="size-7" strokeWidth={1.5} />
                  </div>
                  <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-brass">
                    Step {index + 1} of {HOST_STEPS.length}
                  </p>
                  <h3 className="mt-3 font-display text-2xl font-medium tracking-tight">
                    {item.title}
                  </h3>
                  <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Previous step"
            onClick={() => goTo(activeIndex - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-2">
            {HOST_STEPS.map((item, index) => (
              <button
                key={item.title}
                type="button"
                aria-label={`Go to step ${index + 1}: ${item.title}`}
                aria-current={index === activeIndex ? 'step' : undefined}
                onClick={() => setActiveIndex(index)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === activeIndex
                    ? 'w-6 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                )}
              />
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Next step"
            onClick={() => goTo(activeIndex + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mt-6 hidden justify-center gap-3 sm:flex">
        {HOST_STEPS.map((item, index) => {
          const StepIcon = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                'flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors',
                index === activeIndex
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-border hover:text-foreground'
              )}
            >
              <StepIcon className="size-4 shrink-0" />
              <span>{item.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
