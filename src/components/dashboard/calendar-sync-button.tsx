'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, ChevronDown, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalendarSyncButtonProps {
  /** Absolute https URL of the property's calendar feed. */
  feedUrl: string;
  size?: 'sm' | 'default';
  className?: string;
}

/**
 * Subscribe-to-calendar control for a property. Unlike the per-visit
 * "Add to calendar", this hands out a live feed URL: new confirmed visits appear
 * automatically and cancellations drop off, on the calendar app's own refresh
 * schedule. Apple opens via webcal://; Google takes the feed as a subscription.
 */
export function CalendarSyncButton({
  feedUrl,
  size = 'sm',
  className,
}: CalendarSyncButtonProps) {
  const webcalUrl = feedUrl.replace(/^https?:\/\//, 'webcal://');
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
    webcalUrl
  )}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(feedUrl);
      toast.success('Calendar feed link copied');
    } catch {
      toast.error('Could not copy — select and copy the link manually');
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} className={cn(className)}>
          <Calendar className="mr-1 h-4 w-4" />
          Add to calendar
          <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="font-normal text-muted-foreground">
          Keep confirmed visits in sync. New visits appear automatically.
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a href={webcalUrl}>Apple Calendar</a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={googleUrl} target="_blank" rel="noreferrer">
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={(e) => {
          e.preventDefault();
          copyLink();
        }}>
          <Copy className="mr-2 h-4 w-4" />
          Copy feed link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
