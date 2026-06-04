'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface SectionNavItem {
  id: string;
  label: string;
}

/** Offset (px) for the sticky top nav (h-14) + this bar, used for scrollspy. */
const SCROLL_OFFSET = 120;

export function SectionNav({ sections }: { sections: SectionNavItem[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    function onScroll() {
      let current = sections[0]?.id ?? '';
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= SCROLL_OFFSET) {
          current = s.id;
        }
      }
      setActive(current);
    }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [sections]);

  function handleClick(e: React.MouseEvent, id: string) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
    setActive(id);
  }

  return (
    <div className="sticky top-14 z-30 mt-6 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
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
