import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  getInvitationByToken,
  guestMatchesInvitation,
  isInvitationActive,
} from '@/lib/invitations';
import { getCoGuestsForInvitation } from '@/lib/coguests';
import { getAuthUser } from '@/lib/auth';
import { getInvitationRoomAvailability } from '@/lib/guest-availability';
import { formatDateRange, formatDate } from '@/lib/dates';
import { PropertySections } from '@/components/property-sections';
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
import { CalendarCheck, CalendarRange, MapPin, Sparkles } from 'lucide-react';
import { summarizeBeds } from '@/lib/validations';
import { PhotoGallery } from '@/components/photo-gallery';

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
  const isAuthenticated = guestMatchesInvitation(authUser, invitation);

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

  const typeDescription =
    invitation.type === 'standing'
      ? 'There’s no set window — request any available dates within your invited rooms.'
      : invitation.type === 'date_offer'
        ? 'Choose your dates within the windows your host has opened on the calendar.'
        : 'Your host has offered specific dates — accept the stay exactly as proposed.';

  const TypeIcon =
    invitation.type === 'standing'
      ? Sparkles
      : invitation.type === 'date_offer'
        ? CalendarRange
        : CalendarCheck;

  const host = (
    property as unknown as {
      owner?: { first_name: string | null; last_name: string | null } | null;
    }
  ).owner;
  const hostName = host?.first_name?.trim() || 'Your host';
  const inviteTypeWord =
    invitation.type === 'standing'
      ? 'open'
      : invitation.type === 'date_offer'
        ? 'date offer'
        : 'fixed stay';
  const inviteArticle = invitation.type === 'standing' ? 'an' : 'a';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto w-full max-w-6xl px-6 pt-6 pb-24">
        {/* Invitation headline */}
        <h1 className="mb-8 max-w-4xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          {hostName} has sent you {inviteArticle} {inviteTypeWord} invitation to
          stay at{' '}
          <span className="text-muted-foreground">{property.name}</span>.
        </h1>

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
            <p className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {property.name}
            </p>
            {property.address && (
              <p className="mt-2 flex items-center gap-1.5 text-base text-white/80">
                <MapPin className="h-4 w-4" />
                {property.address}
              </p>
            )}
          </div>
        </div>

        <PhotoGallery
          photos={property.property_images ?? []}
          title="Photos"
          className="py-6"
        />

        <BookingProvider
          rooms={bookableRooms}
          roomAvailability={roomAvailability}
          defaultSelectedRoomIds={roomIds}
          lockRoomSelection={isPrixFixe}
          defaultRange={defaultRange}
          defaultGuests={1}
        >
          <div className="mt-8 grid gap-x-12 gap-y-12 lg:grid-cols-[1fr_360px]">
            <div className="min-w-0">
              {/* Invitation type */}
              <div className="flex items-center gap-4 rounded-2xl border p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-muted">
                  <TypeIcon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium">{typeLabel}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {typeDescription}
                  </p>
                </div>
                {invitation.expires_at && (
                  <Badge variant="outline" className="ml-auto shrink-0">
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

              <div className="mt-2 divide-y">
              {/* Available dates */}
              <section className="py-10 first:pt-0">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Available dates
                </h2>
                {invitation.type !== 'standing' &&
                  (invitation.windows.length > 0 ? (
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
                    <p className="mt-2 text-base text-muted-foreground">
                      Contact your host for date details.
                    </p>
                  ))}

                {(active || previewMode) && showBookingCalendar && (
                  <div className="mt-8">
                    <HouseCalendar
                      allowedRanges={allowedRanges}
                      monthsToShow={2}
                      disabled={isPrixFixe}
                    />
                  </div>
                )}
              </section>

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

              <PropertySections property={property} />

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
