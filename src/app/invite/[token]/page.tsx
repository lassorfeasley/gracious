import { notFound } from 'next/navigation';
import Image from 'next/image';
import {
  getInvitationByToken,
  isInvitationActive,
} from '@/lib/invitations';
import { getCoGuestsForInvitation } from '@/lib/coguests';
import { getAuthUser } from '@/lib/auth';
import { formatDateRange, formatDate } from '@/lib/dates';
import { MagicLinkForm } from '@/components/guest/magic-link-form';
import { BookingForm } from '@/components/guest/booking-form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Users, Calendar, Wifi, BedDouble, Check } from 'lucide-react';
import { summarizeBeds } from '@/lib/validations';

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const invitation = await getInvitationByToken(token);

  if (!invitation) notFound();

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

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative">
        {property.hero_image_url ? (
          <div className="relative h-64 w-full sm:h-80">
            <Image
              src={property.hero_image_url}
              alt={property.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
              <h1 className="text-3xl font-semibold sm:text-4xl">{property.name}</h1>
              {property.address && (
                <p className="mt-1 flex items-center gap-1 text-sm opacity-90">
                  <MapPin className="h-4 w-4" />
                  {property.address}
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="border-b bg-muted/30 px-6 py-16 text-center">
            <h1 className="text-4xl font-semibold tracking-tight">{property.name}</h1>
            {property.address && (
              <p className="mt-2 flex items-center justify-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {property.address}
              </p>
            )}
          </div>
        )}
      </section>

      <div className="container mx-auto max-w-2xl px-4 py-8 space-y-10">
        {!active && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center text-sm">
            This invitation is no longer active.
          </div>
        )}

        {invitation.message && (
          <blockquote className="border-l-4 border-foreground/20 pl-4 italic text-muted-foreground">
            &ldquo;{invitation.message}&rdquo;
          </blockquote>
        )}

        {/* Invitation type badge */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            {invitation.type === 'standing'
              ? 'Open invitation'
              : invitation.type === 'date_offer'
                ? 'Date offer'
                : 'Fixed stay'}
          </Badge>
          {invitation.expires_at && (
            <Badge variant="outline">
              Expires {formatDate(invitation.expires_at)}
            </Badge>
          )}
        </div>

        {/* About */}
        {(property.description || property.directions) && (
          <section>
            <h2 className="text-lg font-semibold">About</h2>
            <Separator className="my-3" />
            {property.description && (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {property.description}
              </p>
            )}
            {property.directions && (
              <div className="mt-4">
                <h3 className="text-sm font-medium">How to get there</h3>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                  {property.directions}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Amenities */}
        {property.amenities && property.amenities.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold">Amenities</h2>
            <Separator className="my-3" />
            <ul className="grid gap-2 sm:grid-cols-2">
              {property.amenities.map((a) => (
                <li key={a.key} className="flex items-baseline gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 translate-y-0.5 text-muted-foreground" />
                  <span>
                    {a.label}
                    {a.note ? (
                      <span className="text-muted-foreground"> — {a.note}</span>
                    ) : null}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Your Rooms */}
        <section>
          <h2 className="text-lg font-semibold">Your rooms</h2>
          <Separator className="my-3" />
          <div className="grid gap-4">
            {invitation.rooms.map((room) => (
              <Card key={room.id}>
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {room.image_url ? (
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md">
                        <Image
                          src={room.image_url}
                          alt={room.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md bg-muted text-2xl font-semibold text-muted-foreground">
                        {room.name[0]}
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium">{room.name}</h3>
                      {room.description && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          {room.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BedDouble className="h-3 w-3" />
                          {summarizeBeds(room.beds)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Up to {room.max_occupancy} guests
                        </span>
                      </div>
                      {room.amenities && room.amenities.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {room.amenities.map((a) => (
                            <li
                              key={a.key}
                              className="flex items-baseline gap-2 text-sm"
                            >
                              <Check className="h-3.5 w-3.5 shrink-0 translate-y-0.5 text-muted-foreground" />
                              <span>
                                {a.label}
                                {a.note ? (
                                  <span className="text-muted-foreground">
                                    {' '}
                                    — {a.note}
                                  </span>
                                ) : null}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Available Dates */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5" />
            Available dates
          </h2>
          <Separator className="my-3" />
          {invitation.type === 'standing' ? (
            <p className="text-muted-foreground">
              You can request any available dates within your invited rooms.
            </p>
          ) : invitation.windows.length > 0 ? (
            <ul className="space-y-2">
              {invitation.windows.map((w) => (
                <li
                  key={w.id}
                  className="rounded-lg border px-4 py-3 text-sm font-medium"
                >
                  {formatDateRange(w.start_date, w.end_date)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">Contact your host for date details.</p>
          )}
        </section>

        {/* Who's Staying */}
        <section>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="h-5 w-5" />
            Who&apos;s staying
          </h2>
          <Separator className="my-3" />
          {coguests.visible.length === 0 && !coguests.hasHidden ? (
            <p className="text-sm text-muted-foreground">
              No other confirmed guests during your dates yet.
            </p>
          ) : (
            <p className="text-sm">
              {coguests.visible.map((g) => g.label).join(', ')}
              {coguests.hasHidden && (coguests.visible.length > 0 ? ', and others' : 'and others')}
            </p>
          )}
        </section>

        {/* House Info */}
        {(property.wifi_name ||
          property.check_in_instructions ||
          property.house_rules) && (
          <section>
            <h2 className="text-lg font-semibold">House info</h2>
            <Separator className="my-3" />
            <Accordion type="multiple" className="w-full">
              {property.wifi_name && (
                <AccordionItem value="wifi">
                  <AccordionTrigger>
                    <span className="flex items-center gap-2">
                      <Wifi className="h-4 w-4" /> WiFi
                    </span>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm">
                      Network: <strong>{property.wifi_name}</strong>
                      {property.wifi_password && (
                        <>
                          <br />
                          Password: <strong>{property.wifi_password}</strong>
                        </>
                      )}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}
              {property.check_in_instructions && (
                <AccordionItem value="checkin">
                  <AccordionTrigger>Check-in instructions</AccordionTrigger>
                  <AccordionContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {property.check_in_instructions}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}
              {property.house_rules && (
                <AccordionItem value="rules">
                  <AccordionTrigger>House rules</AccordionTrigger>
                  <AccordionContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {property.house_rules}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </section>
        )}

        {/* CTA */}
        {active && (
          <section className="sticky bottom-0 border-t bg-background/95 py-4 backdrop-blur-sm supports-backdrop-filter:bg-background/80">
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
              />
            )}
          </section>
        )}
      </div>
    </div>
  );
}
