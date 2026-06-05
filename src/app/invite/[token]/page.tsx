import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  getInvitationByToken,
  isInvitationActive,
} from '@/lib/invitations';
import { getCoGuestsForInvitation } from '@/lib/coguests';
import { getAuthUser } from '@/lib/auth';
import { getInvitationRoomAvailability } from '@/lib/guest-availability';
import { formatDateRange, formatDate } from '@/lib/dates';
import { PropertyMap } from '@/components/dashboard/property-map';
import { SiteFooter } from '@/components/site-footer';
import { BookingProvider } from '@/components/guest/booking-context';
import { HouseCalendar } from '@/components/guest/house-calendar';
import { HouseBookingSidebar } from '@/components/guest/house-booking-sidebar';
import {
  appendGuestPreviewToPath,
  isGuestPreviewEnabled,
  parseGuestPreviewAs,
  parseGuestPreviewBookingStatus,
} from '@/lib/guest-preview';
import { Badge } from '@/components/ui/badge';
import { MapPin, Check } from 'lucide-react';
import { summarizeBeds } from '@/lib/validations';

export default async function InvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ preview?: string; as?: string; status?: string }>;
}) {
  const { token } = await params;
  const { preview, as, status } = await searchParams;
  const invitation = await getInvitationByToken(token);

  if (!invitation) notFound();

  const previewMode = isGuestPreviewEnabled(preview);
  const guestPreviewAs = parseGuestPreviewAs(as);
  const guestPreviewBookingStatus = parseGuestPreviewBookingStatus(status);
  const showBookingCalendar =
    !previewMode || guestPreviewAs !== 'booked';
  const active = isInvitationActive(invitation);
  const authUser = await getAuthUser();
  const isAuthenticated =
    !!authUser && authUser.email === invitation.guest_email;

  const coguests = await getCoGuestsForInvitation(
    invitation.property_id,
    invitation.windows,
    authUser?.id
  );

  const property = invitation.property;
  const roomIds = invitation.rooms.map((r) => r.id);
  const roomAvailability = await getInvitationRoomAvailability(roomIds);

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

  const bookableRooms = invitation.rooms.map((r) => ({
    id: r.id,
    name: r.name,
    max_occupancy: r.max_occupancy,
  }));

  const typeLabel =
    invitation.type === 'standing'
      ? 'Open invitation'
      : invitation.type === 'date_offer'
        ? 'Date offer'
        : 'Fixed stay';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 pt-6 pb-24">
        {/* House card */}
        <div className="relative flex h-72 w-full flex-col justify-end overflow-hidden rounded-2xl sm:h-96">
          {property.hero_image_url ? (
            <>
              <Image
                src={property.hero_image_url}
                alt={property.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            </>
          ) : (
            <div className="absolute inset-0 bg-linear-to-br from-slate-700 via-slate-800 to-slate-950" />
          )}
          <div className="relative p-8">
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {property.name}
            </h1>
            {property.address && (
              <p className="mt-2 flex items-center gap-1.5 text-base text-white/80">
                <MapPin className="h-4 w-4" />
                {property.address}
              </p>
            )}
          </div>
        </div>

        {/* Invitation badges */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{typeLabel}</Badge>
          {invitation.expires_at && (
            <Badge variant="outline">
              Expires {formatDate(invitation.expires_at)}
            </Badge>
          )}
        </div>

        {!active && (
          <div className="mt-6 rounded-2xl border border-destructive/50 bg-destructive/10 p-5 text-center text-base">
            This invitation is no longer active.
          </div>
        )}

        {invitation.message && (
          <blockquote className="mt-6 border-l-2 border-foreground/20 pl-5 text-lg italic leading-relaxed text-muted-foreground">
            &ldquo;{invitation.message}&rdquo;
          </blockquote>
        )}

        <BookingProvider
          rooms={bookableRooms}
          roomAvailability={roomAvailability}
          defaultSelectedRoomIds={roomIds}
          lockRoomSelection={isPrixFixe}
          defaultRange={defaultRange}
          defaultGuests={1}
        >
          <div className="mt-8 grid gap-x-12 gap-y-12 lg:grid-cols-[1fr_360px]">
            <div className="min-w-0 divide-y">
              {/* Available dates */}
              <section className="py-10 first:pt-0">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Available dates
                </h2>
                {invitation.type === 'standing' ? (
                  <p className="mt-6 text-base text-muted-foreground">
                    You can request any available dates within your invited
                    rooms.
                  </p>
                ) : invitation.windows.length > 0 ? (
                  <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                    {invitation.windows.map((w) => (
                      <li
                        key={w.id}
                        className="rounded-2xl border px-5 py-4 text-base font-medium"
                      >
                        {formatDateRange(w.start_date, w.end_date)}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-6 text-base text-muted-foreground">
                    Contact your host for date details.
                  </p>
                )}
              </section>

              {/* Availability calendar */}
              {(active || previewMode) && showBookingCalendar && (
                <section className="py-10">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Availability
                  </h2>
                  <p className="mt-2 text-base text-muted-foreground">
                    {isPrixFixe
                      ? 'This is a fixed-date stay.'
                      : 'Select your dates — crossed-out days are unavailable for your selected rooms.'}
                  </p>
                  <div className="mt-6">
                    <HouseCalendar
                      allowedRanges={allowedRanges}
                      monthsToShow={2}
                      disabled={isPrixFixe}
                    />
                  </div>
                </section>
              )}

              {/* Rooms available to you */}
              <section className="py-10">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Rooms available to you
                </h2>
                <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-2">
                  {invitation.rooms.map((room) => (
                    <Link
                      key={room.id}
                      href={
                        previewMode
                          ? appendGuestPreviewToPath(
                              `/invite/${invitation.token}/rooms/${room.id}`,
                              guestPreviewAs,
                              guestPreviewBookingStatus
                            )
                          : `/invite/${invitation.token}/rooms/${room.id}`
                      }
                      className="group block"
                    >
                      {room.image_url ? (
                        <>
                          <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl">
                            <Image
                              src={room.image_url}
                              alt={room.name}
                              fill
                              className="object-cover transition duration-300 group-hover:scale-105"
                            />
                          </div>
                          <p className="mt-4 text-lg font-medium">{room.name}</p>
                          <p className="text-base text-muted-foreground">
                            {summarizeBeds(room.beds)} · Up to{' '}
                            {room.max_occupancy} guests
                          </p>
                        </>
                      ) : (
                        <div className="relative flex aspect-4/3 w-full flex-col justify-end overflow-hidden rounded-2xl bg-linear-to-br from-slate-700 via-slate-800 to-slate-950 p-5 transition duration-300 group-hover:from-slate-600 group-hover:via-slate-700 group-hover:to-slate-900">
                          <p className="text-lg font-medium text-white">
                            {room.name}
                          </p>
                          <p className="text-base text-white/70">
                            {summarizeBeds(room.beds)} · Up to{' '}
                            {room.max_occupancy} guests
                          </p>
                        </div>
                      )}
                      {room.description && (
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          {room.description}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>

              {/* About */}
              {property.description && (
                <section className="py-10">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    About this place
                  </h2>
                  <p className="mt-6 whitespace-pre-wrap text-lg leading-relaxed text-foreground/90">
                    {property.description}
                  </p>
                </section>
              )}

              {/* Location */}
              {property.address && (
                <section className="py-10">
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
                  {property.directions && (
                    <div className="mt-8">
                      <h3 className="text-lg font-medium">Getting there</h3>
                      <p className="mt-2 whitespace-pre-wrap text-base text-muted-foreground">
                        {property.directions}
                      </p>
                    </div>
                  )}
                </section>
              )}

              {/* Amenities */}
              {property.amenities && property.amenities.length > 0 && (
                <section className="py-10">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    What this place offers
                  </h2>
                  <ul className="mt-8 grid gap-x-12 gap-y-5 sm:grid-cols-2">
                    {property.amenities.map((a) => (
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

              {/* Guest information */}
              {(property.wifi_name ||
                property.check_in_instructions ||
                property.house_rules) && (
                <section className="py-10">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Guest information
                  </h2>
                  <dl className="mt-8 grid gap-8 sm:grid-cols-2">
                    {property.check_in_instructions && (
                      <div>
                        <dt className="text-base font-medium">
                          Check-in instructions
                        </dt>
                        <dd className="mt-2 whitespace-pre-wrap text-base text-muted-foreground">
                          {property.check_in_instructions}
                        </dd>
                      </div>
                    )}
                    {property.wifi_name && (
                      <div>
                        <dt className="text-base font-medium">WiFi</dt>
                        <dd className="mt-2 text-base text-muted-foreground">
                          {property.wifi_name}
                          {property.wifi_password
                            ? ` · ${property.wifi_password}`
                            : ''}
                        </dd>
                      </div>
                    )}
                    {property.house_rules && (
                      <div>
                        <dt className="text-base font-medium">House rules</dt>
                        <dd className="mt-2 whitespace-pre-wrap text-base text-muted-foreground">
                          {property.house_rules}
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
              )}

              {/* Who's staying */}
              <section className="py-10">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Who&apos;s staying
                </h2>
                {coguests.visible.length === 0 && !coguests.hasHidden ? (
                  <p className="mt-6 text-base text-muted-foreground">
                    No other confirmed guests during your dates yet.
                  </p>
                ) : (
                  <p className="mt-6 text-base">
                    {coguests.visible.map((g) => g.label).join(', ')}
                    {coguests.hasHidden &&
                      (coguests.visible.length > 0
                        ? ', and others'
                        : 'and others')}
                  </p>
                )}
              </section>
            </div>

            <aside className="lg:sticky lg:top-8 lg:self-start">
              {active || previewMode ? (
                <HouseBookingSidebar
                  invitation={invitation}
                  propertyName={property.name}
                  isAuthenticated={isAuthenticated}
                  previewMode={previewMode}
                  guestPreviewAs={guestPreviewAs}
                  guestPreviewBookingStatus={guestPreviewBookingStatus}
                  isPrixFixe={isPrixFixe}
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
