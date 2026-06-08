'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PreviewVariant {
  label: string;
  subject: string;
  html: string;
}

export function EmailPreview({ variants }: { variants: PreviewVariant[] }) {
  const [active, setActive] = useState(0);
  const current = variants[active] ?? variants[0];

  return (
    <div className="space-y-3">
      {variants.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {variants.map((v, i) => (
            <button
              key={v.label}
              type="button"
              onClick={() => setActive(i)}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs font-medium transition-colors',
                i === active
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-muted-foreground hover:bg-muted/60'
              )}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">Subject:</span>
          <span className="font-medium">{current.subject}</span>
        </div>
        <iframe
          title={`Preview: ${current.label}`}
          srcDoc={current.html}
          sandbox=""
          className="h-[640px] w-full bg-white"
        />
      </div>
    </div>
  );
}
