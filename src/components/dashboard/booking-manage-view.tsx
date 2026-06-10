'use client';

import { type ReactNode } from 'react';
import Link from 'next/link';
import { Mail, Phone, User as UserIcon } from 'lucide-react';
import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';
import {
  BookingProvider,
  useBooking,
  type BookableRoom,
} from '@/components/guest/booking-context';
import { HostManageStayCard } from '@/components/dashboard/host-manage-stay-card';
import { BookingMainActions } from '@/components/dashboard/booking-main-actions';
import type { CalendarBooking, RoomAvailability } from '@/lib/guest-calendar';
import type { BookingWithDetails } from '@/types/database';
import { INVITATION_TYPE_LABELS } from '@/lib/invitation-types';

function bookingTypeInfo(booking: BookingWithDetails): {
  label: string;
  description: string;
} {
  if (!booking.invitation_id || !booking.invitation) {
    return {
      label: 'Manual stay',
      description:
        'You added this stay directly. The guest isn\u2019t using the app, so dates are simply blocked on your calendar.',
    };
  }
  switch (booking.invitation.type) {
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
  stayBooking,
  bookingHrefBase,
}: {
  stayBooking: CalendarBooking;
  bookingHrefBase?: string;
}) {
  const { combinedBookings, combinedBlocks } = useBooking();

  return (
    <AvailabilityCalendar
      bookings={[...combinedBookings, stayBooking]}
      blocks={combinedBlocks}
      monthsToShow={2}
      bookingHrefBase={bookingHrefBase}
    />
  );
}

export function BookingManageView({
  booking,
  rooms,
  roomAvailability,
  guestProfileHref,
  bookingHrefBase,
  children,
}: {
  booking: BookingWithDetails;
  rooms: BookableRoom[];
  roomAvailability: Record<string, RoomAvailability>;
  guestProfileHref?: string;
  bookingHrefBase?: string;
  children: ReactNode;
}) {
  const stayBooking: CalendarBooking = {
    id: booking.id,
    guestName: booking.guest.name ?? 'This stay',
    checkIn: booking.dates.check_in,
    checkOut: booking.dates.check_out,
  };

  const typeInfo = bookingTypeInfo(booking);

  return (
    <BookingProvider
      rooms={rooms}
      roomAvailability={roomAvailability}
      defaultSelectedRoomIds={booking.rooms.map((r) => r.id)}
      defaultRange={{
        checkIn: booking.dates.check_in,
        checkOut: booking.dates.check_out,
      }}
      defaultGuests={booking.party_size}
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
              {booking.guest.name ?? 'Guest'}
            </p>
            <div className="mt-2 space-y-1.5 text-base">
              {booking.guest.email && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a
                    href={`mailto:${booking.guest.email}`}
                    className="hover:text-foreground"
                  >
                    {booking.guest.email}
                  </a>
                </p>
              )}
              {booking.guest_phone && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  {booking.guest_phone}
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
              This stay is highlighted. Hover any date to see who&apos;s staying,
              or click a booked date to open it.
            </p>
            <div className="mt-6">
              <ManageCalendar
                stayBooking={stayBooking}
                bookingHrefBase={bookingHrefBase}
              />
            </div>
          </section>
          {children}
          <BookingMainActions booking={booking} />
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <HostManageStayCard booking={booking} />
        </aside>
      </div>
    </BookingProvider>
  );
}
