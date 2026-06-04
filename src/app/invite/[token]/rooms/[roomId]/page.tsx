import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, BedDouble, Check } from 'lucide-react';
import {
  getInvitationByToken,
  isInvitationActive,
} from '@/lib/invitations';
import { getAuthUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { assignColors } from '@/lib/calendar-colors';
import { summarizeBeds, BED_SIZE_LABELS } from '@/lib/validations';
import { AvailabilityCalendar } from '@/components/dashboard/availability-calendar';
import { PropertyMap } from '@/components/dashboard/property-map';
import { MagicLinkForm } from '@/components/guest/magic-link-form';
import { BookingForm } from '@/components/guest/booking-form';
import type { Amenity } from '@/types/database';

function bedLabel(bed: string): string {
  return BED_SIZE_LABELS[bed as keyof typeof BED_SIZE_LABELS] ?? bed;
}

export default async function GuestRoomPage({
  params,
}: {
  params: Promise<{ token: string; roomId: string }>;
}) {
  const { token, roomId } = await params;
  const invitation = await getInvitationByToken(token);
  if (!invitation) notFound();

  const room = invitation.rooms.find((r) => r.id === roomId);
  if (!room) notFound();

  const active = isInvitationActive(invitation);
  const authUser = await getAuthUser();
  const isAuthenticated =
    !!authUser && authUser.email === invitation.guest_email;
  const property = invitation.property;

  const admin = createAdminClient();
  const { data: bookingRows } = await admin
    .from('booking_rooms')
    .select(
      `booking:bookings(id, status, dates:booking_dates(check_in, check_out))`
    )
    .eq('room_id', roomId);

  const roomBookings = assignColors(
    (bookingRows ?? [])
      .map((row) => (Array.isArray(row.booking) ? row.booking[0] : row.booking))
      .filter(
        (b): b is NonNullable<typeof b> =>
          !!b && (b.status === 'approved' || b.status === 'requested')
      )
      .map((b) => {
        const dates = Array.isArray(b.dates) ? b.dates[0] : b.dates;
        return {
          id: b.id,
          guestName: 'Booked',
          checkIn: dates?.check_in ?? '',
          checkOut: dates?.check_out ?? '',
        };
      })
      .filter((b) => b.checkIn && b.checkOut)
  );

  const { data: blocks } = await admin
    .from('room_availability')
    .select('*')
    .eq('room_id', roomId)
    .eq('is_blocked', true);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative h-72 w-full sm:h-96">
        {room.image_url ? (
          <>
            <Image
              src={room.image_url}
              alt={room.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-linear-to-br from-slate-700 via-slate-800 to-slate-950" />
        )}
        <div className="absolute left-0 top-0 p-5">
          <Link
            href={`/invite/${invitation.token}`}
            className="inline-flex items-center gap-1 rounded-full bg-black/30 px-3 py-1.5 text-sm text-white backdrop-blur transition-colors hover:bg-black/50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>
        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-5xl px-6 pb-8 text-white">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {room.name}
            </h1>
            <p className="mt-2 text-base text-white/80">
              Up to {room.max_occupancy} guests · {summarizeBeds(room.beds)}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-6 pb-40">
        {!active && (
          <div className="mt-8 rounded-2xl border border-destructive/50 bg-destructive/10 p-5 text-center text-base">
            This invitation is no longer active.
          </div>
        )}

        {/* About */}
        {room.description && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold tracking-tight">
              About this room
            </h2>
            <p className="mt-6 whitespace-pre-wrap text-lg leading-relaxed text-foreground/90">
              {room.description}
            </p>
          </section>
        )}

        {/* Where you sleep */}
        {room.beds.length > 0 && (
          <section className="mt-16 border-t pt-12">
            <h2 className="text-2xl font-semibold tracking-tight">
              Where you&apos;ll sleep
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              {room.beds.map((bed: string, i: number) => (
                <div key={i} className="rounded-xl border p-4">
                  <BedDouble className="h-7 w-7" strokeWidth={1.5} />
                  <p className="mt-3 font-medium">{bedLabel(bed)} bed</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* What this room offers */}
        {room.amenities && room.amenities.length > 0 && (
          <section className="mt-16 border-t pt-12">
            <h2 className="text-2xl font-semibold tracking-tight">
              What this room offers
            </h2>
            <ul className="mt-8 grid gap-x-12 gap-y-5 sm:grid-cols-2">
              {room.amenities.map((a: Amenity) => (
                <li
                  key={a.key}
                  className="flex items-start gap-4 border-b border-border/60 pb-5 text-base"
                >
                  <Check
                    className="mt-0.5 h-5 w-5 shrink-0 text-foreground"
                    strokeWidth={1.5}
                  />
                  <span>
                    {a.label}
                    {a.note ? (
                      <span className="block text-sm text-muted-foreground">
                        {a.note}
                      </span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Availability */}
        <section className="mt-16 border-t pt-12">
          <h2 className="text-2xl font-semibold tracking-tight">Availability</h2>
          <p className="mt-2 text-base text-muted-foreground">
            Crossed-out dates are already booked or unavailable.
          </p>
          <div className="mt-6">
            <AvailabilityCalendar bookings={roomBookings} blocks={blocks ?? []} />
          </div>
        </section>

        {/* Location */}
        {property.address && (
          <section className="mt-16 border-t pt-12">
            <h2 className="text-2xl font-semibold tracking-tight">
              Where you&apos;re hosting
            </h2>
            <div className="mt-6">
              <PropertyMap
                address={property.address}
                latitude={property.latitude}
                longitude={property.longitude}
              />
            </div>
          </section>
        )}
      </div>

      {/* CTA */}
      {active && (
        <div className="sticky bottom-0 border-t bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/80">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-5">
            <div>
              <p className="font-medium">{room.name}</p>
              <p className="text-sm text-muted-foreground">
                Up to {room.max_occupancy} guests · {summarizeBeds(room.beds)}
              </p>
            </div>
            {!isAuthenticated ? (
              <MagicLinkForm
                email={invitation.guest_email}
                token={invitation.token}
              />
            ) : (
              <BookingForm
                invitation={invitation}
                isAuthenticated={isAuthenticated}
                guestEmail={invitation.guest_email}
                guestName={invitation.guest_name}
                lockedRoom={room}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
