import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getDashboardProperty } from '@/lib/dashboard-property';
import { buildGuestRoster, findRosterEntry } from '@/lib/guest-roster';
import { parseGuestKey } from '@/lib/guest-keys';
import { formatDate, formatDateRange } from '@/lib/dates';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GuestProfileActions } from '@/components/dashboard/guest-profile-actions';
import type { Invitation } from '@/types/database';

const typeLabels: Record<string, string> = {
  standing: 'Standing invitation',
  date_offer: 'Date offer',
  prix_fixe: 'Fixed stay',
};

const statusVariant: Record<
  string,
  'default' | 'secondary' | 'destructive' | 'outline'
> = {
  pending: 'secondary',
  accepted: 'default',
  expired: 'outline',
  revoked: 'destructive',
  approved: 'default',
  requested: 'secondary',
  declined: 'destructive',
  cancelled: 'outline',
};

export default async function GuestProfilePage({
  params,
}: {
  params: Promise<{ slug: string; guestKey: string }>;
}) {
  const { slug, guestKey } = await params;
  if (!parseGuestKey(guestKey)) notFound();

  const property = await getDashboardProperty(slug);
  const supabase = await createClient();

  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('property_id', property.id);

  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      `
      id, status, invitation_id, guest_name, guest_email, guest_phone, party_size, notes,
      guest:users!guest_user_id(name, email),
      dates:booking_dates(check_in, check_out),
      booking_rooms(room:rooms(name)),
      invitation:invitations(*)
    `
    )
    .eq('property_id', property.id)
    .order('created_at', { ascending: false });

  const roster = buildGuestRoster(
    (invitations ?? []) as Invitation[],
    bookings ?? []
  );
  const guest = findRosterEntry(roster, guestKey);
  if (!guest) notFound();

  const upcomingManualId =
    guest.upcomingStay?.isManual ? guest.upcomingStay.bookingId : null;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <Link
        href={`/dashboard/${slug}/guests`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All guests
      </Link>

      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{guest.name}</h1>
          <div className="mt-2 space-y-1 text-muted-foreground">
            {guest.email && (
              <p className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                {guest.email}
              </p>
            )}
            {guest.phone && (
              <p className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" />
                {guest.phone}
              </p>
            )}
            {!guest.email && !guest.phone && (
              <p className="text-sm">No contact info — manual stay only</p>
            )}
          </div>
        </div>

        <GuestProfileActions
          invitationToken={guest.invitation?.token}
          invitationId={guest.invitation?.id}
          invitationStatus={guest.invitation?.status}
          manualBookingId={upcomingManualId}
          invitePageHref={
            guest.invitation?.token
              ? `/invite/${guest.invitation.token}`
              : undefined
          }
        />
      </div>

      {guest.upcomingStay && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming stay</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-lg font-medium">
              {formatDateRange(
                guest.upcomingStay.checkIn,
                guest.upcomingStay.checkOut
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              {guest.upcomingStay.partySize} guests ·{' '}
              {guest.upcomingStay.roomNames.join(', ') || 'Rooms TBD'}
            </p>
            <div className="flex gap-2">
              <Badge variant={statusVariant[guest.upcomingStay.status] ?? 'outline'}>
                {guest.upcomingStay.status}
              </Badge>
              {guest.upcomingStay.isManual && (
                <Badge variant="secondary">Manual stay</Badge>
              )}
            </div>
            {guest.upcomingStay.notes && (
              <p className="text-sm italic text-muted-foreground">
                &ldquo;{guest.upcomingStay.notes}&rdquo;
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {guest.invitation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invitation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant[guest.invitation.status] ?? 'outline'}>
                {guest.invitation.status}
              </Badge>
              <Badge variant="outline">
                {typeLabels[guest.invitation.type] ?? guest.invitation.type}
              </Badge>
              <Badge variant="outline">
                {guest.invitation.requiresApproval
                  ? 'Approval required'
                  : 'Auto-confirm'}
              </Badge>
            </div>
            {guest.invitation.message && (
              <p className="text-sm text-muted-foreground">
                {guest.invitation.message}
              </p>
            )}
            {guest.invitation.expiresAt && (
              <p className="text-xs text-muted-foreground">
                Expires {formatDate(guest.invitation.expiresAt)}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="text-lg font-semibold">Stay history</h2>
        {guest.stays.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No bookings yet
            {guest.invitation?.status === 'pending'
              ? ' — waiting for them to book.'
              : '.'}
          </p>
        ) : (
          <ul className="mt-4 divide-y rounded-lg border">
            {guest.stays.map((stay) => (
              <li key={stay.bookingId} className="space-y-1 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">
                    {formatDateRange(stay.checkIn, stay.checkOut)}
                  </p>
                  <div className="flex gap-2">
                    <Badge variant={statusVariant[stay.status] ?? 'outline'}>
                      {stay.status}
                    </Badge>
                    {stay.isManual && (
                      <Badge variant="secondary">Manual</Badge>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {stay.partySize} guests · {stay.roomNames.join(', ')}
                </p>
                {stay.notes && (
                  <p className="text-sm italic text-muted-foreground">
                    {stay.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
