'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SectionNavItem {
  id: string;
  label: string;
}

export function SectionNav({
  sections,
  className,
  scrollOffset = 120,
}: {
  sections: SectionNavItem[];
  /** Overrides the sticky offset + spacing (defaults to host top-nav layout). */
  className?: string;
  /** Scroll position (px) at which a section becomes active. */
  scrollOffset?: number;
}) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    function onScroll() {
      let current = sections[0]?.id ?? '';
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= scrollOffset) {
          current = s.id;
        }
      }
      setActive(current);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sections, scrollOffset]);

  function handleClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    setActive(id);
  }

  return (
    <div
      className={cn(
        'sticky z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70',
        className ?? 'top-14 mt-6'
      )}
    >
      <nav className="flex gap-6 overflow-x-auto">
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => handleClick(e, s.id)}
            className={cn(
              'whitespace-nowrap border-b-2 py-3 text-sm transition-colors',
              active === s.id
                ? 'border-foreground font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {s.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
