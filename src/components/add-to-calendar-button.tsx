'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddToCalendarButtonProps {
  /** Visit to add. Ignored when `baseUrl` is supplied. */
  visitId?: string;
  /** Override the ical endpoint (e.g. an invitation feed). Takes precedence. */
  baseUrl?: string;
  /** Visual size of the trigger button. */
  size?: 'sm' | 'default';
  /** Trigger button variant. */
  variant?: 'outline' | 'ghost' | 'secondary';
  className?: string;
}

/**
 * "Add to calendar" with the conventional provider spread: Google and
 * Outlook.com open pre-filled add-event pages; Apple/other downloads an .ics.
 * All three go through an authenticated ical endpoint (a visit by default, or
 * any `baseUrl` such as an invitation).
 */
export function AddToCalendarButton({
  visitId,
  baseUrl,
  size = 'sm',
  variant = 'outline',
  className,
}: AddToCalendarButtonProps) {
  const base = baseUrl ?? `/api/visits/${visitId}/ical`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={cn(className)}>
          <Calendar className="mr-1 h-4 w-4" />
          Add to calendar
          <ChevronDown className="ml-1 h-3.5 w-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem asChild>
          <a href={`${base}?provider=google`} target="_blank" rel="noreferrer">
            Google Calendar
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={`${base}?provider=outlook`} target="_blank" rel="noreferrer">
            Outlook.com
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <a href={base} download>
            Apple Calendar (.ics)
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
