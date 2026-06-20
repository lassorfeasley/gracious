'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Long-form text that clamps to a few lines on mobile with a "Show more"
 * toggle, and renders in full on `lg`+ (where there's room in the layout).
 */
export function ExpandableText({
  text,
  className,
  clampClassName = 'line-clamp-5',
}: {
  text: string;
  className?: string;
  /** Mobile clamp applied while collapsed; removed on `lg`+ and when expanded. */
  clampClassName?: string;
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clampable, setClampable] = useState(false);

  // Measure overflow only while collapsed (when expanded the clamp is removed,
  // so there'd be nothing to detect). Keeps the toggle visible once opened.
  useEffect(() => {
    if (expanded) return;
    const el = ref.current;
    if (!el) return;
    const check = () => setClampable(el.scrollHeight - el.clientHeight > 1);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, expanded]);

  return (
    <div>
      <p
        ref={ref}
        className={cn(
          className,
          !expanded && cn(clampClassName, 'lg:line-clamp-none')
        )}
      >
        {text}
      </p>
      {clampable && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-base font-medium underline underline-offset-4 lg:hidden"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
