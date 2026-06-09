'use client';

import type { ReactNode } from 'react';
import { HouseCalendar } from '@/components/guest/house-calendar';

export function HostCalendarSection({
  slug,
  sectionId,
  title,
  footer,
  className,
}: {
  slug: string;
  sectionId?: string;
  title?: string;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={sectionId}
      className={className ?? 'scroll-mt-28 py-10 first:pt-0'}
    >
      {title && (
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
      )}
      <div className={title ? 'mt-6' : 'mt-4'}>
        <HouseCalendar
          monthsToShow={2}
          bookingHrefBase={`/dashboard/${slug}/bookings`}
        />
      </div>
      {footer}
    </section>
  );
}
