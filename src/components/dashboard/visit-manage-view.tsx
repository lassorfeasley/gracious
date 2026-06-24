'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { Mail, Phone, User as UserIcon } from 'lucide-react';
import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';
import {
  VisitProvider,
  useVisit,
  type RequestableRoom,
} from '@/components/guest/visit-context';
import { HostManageVisitCard } from '@/components/dashboard/host-manage-visit-card';
import { VisitMainActions } from '@/components/dashboard/visit-main-actions';
import type { CalendarVisit, RoomAvailability } from '@/lib/guest-calendar';
import type { VisitWithDetails } from '@/types/database';
import { INVITATION_TYPE_LABELS } from '@/lib/invitation-types';

function visitTypeInfo(visit: VisitWithDetails): {
  label: string;
  description: string;
} {
  if (!visit.invitation_id || !visit.invitation) {
    return {
      label: 'Manual visit',
      description:
        'You added this visit directly. The guest isn\u2019t using the app, so dates are simply blocked on your calendar.',
    };
  }
  switch (visit.invitation.type) {
    case 'standing':
      return {
        label: INVITATION_TYPE_LABELS.standing,
        description:
          'The guest was invited to request any available dates within their invited rooms.',
      };
    case 'date_offer':
      return {
        label: INVITATION_TYPE_LABELS.date_offer,
        description:
          'The guest chose these dates from within the date windows you offered.',
      };
    case 'prix_fixe':
      return {
        label: INVITATION_TYPE_LABELS.prix_fixe,
        description: 'The guest accepted the exact dates you offered.',
      };
    default:
      return { label: 'Invitation', description: '' };
  }
}

function ManageCalendar({
  stayVisit,
  visitHrefBase,
}: {
  stayVisit: CalendarVisit;
  visitHrefBase?: string;
}) {
  const { combinedVisits, combinedBlocks } = useVisit();

  return (
    <AvailabilityCalendar
      visits={[...combinedVisits, stayVisit]}
      blocks={combinedBlocks}
      monthsToShow={2}
      visitHrefBase={visitHrefBase}
    />
  );
}

export function VisitManageView({
  visit,
  rooms,
  roomAvailability,
  guestProfileHref,
  visitHrefBase,
  children,
}: {
  visit: VisitWithDetails;
  rooms: RequestableRoom[];
  roomAvailability: Record<string, RoomAvailability>;
  guestProfileHref?: string;
  visitHrefBase?: string;
  children: ReactNode;
}) {
  const stayVisit: CalendarVisit = {
    id: visit.id,
    guestName: visit.guest.name ?? 'This visit',
    checkIn: visit.dates.check_in,
    checkOut: visit.dates.check_out,
  };

  const typeInfo = visitTypeInfo(visit);

  return (
    <VisitProvider
      rooms={rooms}
      roomAvailability={roomAvailability}
      defaultSelectedRoomIds={visit.rooms.map((r) => r.id)}
      defaultRange={{
        checkIn: visit.dates.check_in,
        checkOut: visit.dates.check_out,
      }}
      defaultGuests={visit.party_size}
    >
      <div className="mt-8 grid gap-x-12 gap-y-12 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 divide-y">
          <section className="py-10 first:pt-0">
            <h2 className="text-2xl font-semibold tracking-tight">
              {typeInfo.label}
            </h2>
            {typeInfo.description && (
              <p className="mt-2 text-base text-muted-foreground">
                {typeInfo.description}
              </p>
            )}
          </section>

          <section className="py-10">
            <h2 className="text-2xl font-semibold tracking-tight">Guest</h2>
            <p className="mt-4 text-lg font-medium">
              {visit.guest.name ?? 'Guest'}
            </p>
            <div className="mt-2 space-y-1.5 text-base">
              {visit.guest.email && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a
                    href={`mailto:${visit.guest.email}`}
                    className="hover:text-foreground"
                  >
                    {visit.guest.email}
                  </a>
                </p>
              )}
              {visit.guest_phone && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  {visit.guest_phone}
                </p>
              )}
              {guestProfileHref && (
                <Link
                  href={guestProfileHref}
                  className="inline-flex items-center gap-2 text-primary hover:underline"
                >
                  <UserIcon className="h-4 w-4 shrink-0" />
                  View guest profile
                </Link>
              )}
            </div>
          </section>

          <section className="py-10">
            <h2 className="text-2xl font-semibold tracking-tight">Calendar</h2>
            <p className="mt-2 text-base text-muted-foreground">
              This visit is highlighted. Hover any date to see who&apos;s staying,
              or click a booked date to open it.
            </p>
            <div className="mt-6">
              <ManageCalendar
                stayVisit={stayVisit}
                visitHrefBase={visitHrefBase}
              />
            </div>
          </section>
          {children}
          <VisitMainActions visit={visit} />
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <HostManageVisitCard visit={visit} />
        </aside>
      </div>
    </VisitProvider>
  );
}
