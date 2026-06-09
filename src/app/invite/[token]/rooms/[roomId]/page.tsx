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
import { PropertyMap } from '@/components/dashboard/property-map';
import { SectionNav } from '@/components/dashboard/section-nav';
import { SiteFooter } from '@/components/site-footer';
import { BookingProvider } from '@/components/guest/booking-context';
import { SelectableRoomCalendar } from '@/components/guest/selectable-room-calendar';
import { BookingSidebar } from '@/components/guest/booking-sidebar';
import {
  appendGuestPreviewToPath,
  isGuestPreviewEnabled,
  parseGuestPreviewAs,
  parseGuestPreviewBookingStatus,
} from '@/lib/guest-preview';
import type { Amenity } from '@/types/database';
import { PhotoGallery } from '@/components/photo-gallery';

function bedLabel(bed: string): string {
  return BED_SIZE_LABELS[bed as keyof typeof BED_SIZE_LABELS] ?? bed;
}

export default async function GuestRoomPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string; roomId: string }>;
  searchParams: Promise<{ preview?: string; as?: string; status?: string }>;
}) {
  const { token, roomId } = await params;
  const { preview, as, status } = await searchParams;
  const invitation = await getInvitationByToken(token);
  if (!invitation) notFound();

  const room = invitation.rooms.find((r) => r.id === roomId);
  if (!room) notFound();

  const previewMode = isGuestPreviewEnabled(preview);
  const guestPreviewAs = parseGuestPreviewAs(as);
  const guestPreviewBookingStatus = parseGuestPreviewBookingStatus(status);
  const showBookingCalendar =
    !previewMode || guestPreviewAs !== 'booked';
  const active = isInvitationActive(invitation);
  const authUser = await getAuthUser();
  const isAuthenticated =
    !!authUser && authUser.email === invitation.guest_email;
  const property = invitation.property;

  const isPrixFixe = invitation.type === 'prix_fixe';
  const fixedWindow = isPrixFixe ? invitation.windows[0] : undefined;
  const defaultRange = fixedWindow
    ? { checkIn: fixedWindow.start_date, checkOut: fixedWindow.end_date }
    : undefined;
  const allowedRanges =
    invitation.windows.length > 0
      ? invitation.windows.map((w) => ({
          start: w.start_date,
          end: w.end_date,
        }))
      : undefined;

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

  const navSections = [
    ...(room.description ? [{ id: 'about', label: 'About' }] : []),
    ...(room.beds.length > 0 ? [{ id: 'sleeping', label: 'Beds' }] : []),
    ...(room.amenities && room.amenities.length > 0
      ? [{ id: 'amenities', label: 'Amenities' }]
      : []),
    ...(showBookingCalendar
      ? [{ id: 'availability', label: 'Availability' }]
      : []),
    ...(property.address ? [{ id: 'location', label: 'Location' }] : []),
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 pt-6 pb-24">
        <Link
          href={
            previewMode
              ? appendGuestPreviewToPath(
                  `/invite/${invitation.token}`,
                  guestPreviewAs,
                  guestPreviewBookingStatus
                )
              : `/invite/${invitation.token}`
          }
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        {/* Hero card */}
        {room.image_url ? (
          <>
            <div className="mt-4">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                {room.name}
              </h1>
              <p className="mt-2 text-base text-muted-foreground">
                Up to {room.max_occupancy} guests · {summarizeBeds(room.beds)}
              </p>
            </div>
            <div className="relative mt-6 h-72 w-full overflow-hidden rounded-2xl sm:h-[420px]">
              <Image
                src={room.image_url}
                alt={room.name}
                fill
                className="object-cover"
                priority
              />
            </div>
          </>
        ) : (
          <div className="relative mt-4 flex h-72 w-full flex-col justify-end overflow-hidden rounded-2xl bg-linear-to-br from-slate-700 via-slate-800 to-slate-950 p-6 sm:h-[420px]">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {room.name}
            </h1>
            <p className="mt-2 text-base text-white/70">
              Up to {room.max_occupancy} guests · {summarizeBeds(room.beds)}
            </p>
          </div>
        )}

        <PhotoGallery
          photos={room.room_images ?? []}
          title="Photos"
          className="py-6"
        />

        <SectionNav
          sections={navSections}
          className="top-0 mt-8"
          scrollOffset={80}
        />

        <BookingProvider
          defaultRange={defaultRange}
          defaultGuests={1}
          maxGuestsCap={room.max_occupancy}
        >
          <div className="mt-6 grid gap-x-12 gap-y-12 lg:grid-cols-[1fr_360px]">
            {/* Left column */}
            <div className="min-w-0 divide-y">
              {room.description && (
                <section id="about" className="scroll-mt-24 py-10 first:pt-0">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    About this room
                  </h2>
                  <p className="mt-6 whitespace-pre-wrap text-lg leading-relaxed text-foreground/90">
                    {room.description}
                  </p>
                </section>
              )}

              {room.beds.length > 0 && (
                <section id="sleeping" className="scroll-mt-24 py-10 first:pt-0">
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

              {room.amenities && room.amenities.length > 0 && (
                <section id="amenities" className="scroll-mt-24 py-10 first:pt-0">
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

              {showBookingCalendar && (
                <section
                  id="availability"
                  className="scroll-mt-24 py-10 first:pt-0"
                >
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Availability
                  </h2>
                  <p className="mt-2 text-base text-muted-foreground">
                    {isPrixFixe
                      ? 'This is a fixed-date stay.'
                      : 'Select your dates — crossed-out days are unavailable.'}
                  </p>
                  <div className="mt-6">
                    <SelectableRoomCalendar
                      bookings={roomBookings}
                      blocks={blocks ?? []}
                      allowedRanges={allowedRanges}
                    />
                  </div>
                </section>
              )}

              {/* Location */}
              {property.address && (
                <section id="location" className="scroll-mt-24 py-10 first:pt-0">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Where you&apos;re staying
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

            {/* Right column — booking sidebar */}
            <aside className="lg:sticky lg:top-20 lg:self-start">
              {active || previewMode ? (
                <BookingSidebar
                  invitation={invitation}
                  propertyName={property.name}
                  room={room}
                  isAuthenticated={isAuthenticated}
                  previewMode={previewMode}
                  guestPreviewAs={guestPreviewAs}
                  guestPreviewBookingStatus={guestPreviewBookingStatus}
                  isPrixFixe={isPrixFixe}
                  maxGuests={room.max_occupancy}
                  bookings={roomBookings}
                  blocks={blocks ?? []}
                  allowedRanges={allowedRanges}
                />
              ) : (
                <div className="rounded-2xl border p-6 text-center text-sm text-muted-foreground">
                  This invitation is no longer active.
                </div>
              )}
            </aside>
          </div>
        </BookingProvider>
      </div>

      <SiteFooter name={property.name} />
    </div>
  );
}
