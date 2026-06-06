'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function SurveyDialogLayout({
  title,
  stepIndex,
  stepCount,
  stepTitle,
  children,
  onBack,
  onNext,
  nextLabel,
  loading = false,
}: {
  title: string;
  stepIndex: number;
  stepCount: number;
  stepTitle: string;
  children: React.ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel: string;
  loading?: boolean;
}) {
  const progress = ((stepIndex + 1) / stepCount) * 100;

  return (
    <DialogContent className="flex max-h-[min(90vh,820px)] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
      <div className="shrink-0 border-b px-8 pb-5 pt-8">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="mt-5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Step {stepIndex + 1} of {stepCount}
          </p>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6">
        <h3 className="text-xl font-semibold tracking-tight">{stepTitle}</h3>
        <div className="mt-6">{children}</div>
      </div>

      <div className="flex shrink-0 items-center justify-between border-t px-8 py-5">
        {onBack ? (
          <Button type="button" variant="ghost" onClick={onBack} disabled={loading}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" size="lg" onClick={onNext} disabled={loading}>
          {nextLabel}
        </Button>
      </div>
    </DialogContent>
  );
}
