import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, formatDateRange } from '@/lib/dates';
import type { GuestRosterEntry } from '@/lib/guest-roster';

function guestStatus(entry: GuestRosterEntry, today: string): {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
} {
  const stay = entry.upcomingStay;
  if (stay) {
    if (stay.checkIn <= today && stay.checkOut >= today) {
      return { label: 'On property', variant: 'default' };
    }
    return { label: 'Upcoming stay', variant: 'default' };
  }
  if (entry.invitation?.status === 'pending') {
    return { label: 'Invited', variant: 'secondary' };
  }
  if (entry.invitation?.status === 'accepted') {
    return { label: 'Accepted invite', variant: 'outline' };
  }
  if (entry.pastStaysCount > 0) {
    return { label: 'Past guest', variant: 'outline' };
  }
  if (entry.invitation?.status === 'revoked') {
    return { label: 'Revoked', variant: 'destructive' };
  }
  return { label: '—', variant: 'outline' };
}

const typeLabels: Record<string, string> = {
  standing: 'Standing',
  date_offer: 'Date offer',
  prix_fixe: 'Fixed stay',
};

export function GuestsTable({
  guests,
  slug,
}: {
  guests: GuestRosterEntry[];
  slug: string;
}) {
  const today = new Date().toISOString().split('T')[0];

  if (guests.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No guests yet.
      </p>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guest</TableHead>
            <TableHead className="hidden sm:table-cell">Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden md:table-cell">Next / invite</TableHead>
            <TableHead className="text-right">Profile</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guests.map((guest) => {
            const status = guestStatus(guest, today);
            const nextLabel = guest.upcomingStay
              ? formatDateRange(
                  guest.upcomingStay.checkIn,
                  guest.upcomingStay.checkOut
                )
              : guest.invitation
                ? typeLabels[guest.invitation.type] ?? guest.invitation.type
                : guest.pastStaysCount > 0
                  ? `${guest.pastStaysCount} past stay${guest.pastStaysCount !== 1 ? 's' : ''}`
                  : '—';

            return (
              <TableRow key={guest.key}>
                <TableCell>
                  <div className="font-medium">{guest.name}</div>
                  <div className="text-xs text-muted-foreground sm:hidden">
                    {guest.email ?? 'No email'}
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground sm:table-cell">
                  {guest.email ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {nextLabel}
                  {guest.invitation?.expiresAt && !guest.upcomingStay && (
                    <span className="mt-0.5 block text-xs">
                      Expires {formatDate(guest.invitation.expiresAt)}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/dashboard/${slug}/guests/${guest.key}`}
                    className="text-sm font-medium text-foreground hover:underline"
                  >
                    View
                  </Link>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
