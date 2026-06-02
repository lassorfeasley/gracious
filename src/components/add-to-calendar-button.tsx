'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

export function AddToCalendarButton({ bookingId }: { bookingId: string }) {
  return (
    <Button variant="outline" size="sm" asChild>
      <a href={`/api/bookings/${bookingId}/ical`} download>
        <Calendar className="mr-1 h-4 w-4" />
        Add to calendar
      </a>
    </Button>
  );
}
