'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, Eye } from 'lucide-react';
import type { Invitation, Room } from '@/types/database';
import { getInviteUrl } from '@/lib/invite-url';
import { guestPreviewQuery } from '@/lib/guest-preview';
import { formatDate } from '@/lib/dates';
import Link from 'next/link';

interface InvitationsManagerProps {
  propertySlug: string;
  rooms: Room[];
  invitations: Invitation[];
}

export function InvitationsManager({
  propertySlug,
  rooms,
  invitations,
}: InvitationsManagerProps) {
  const router = useRouter();

  async function revoke(invitationId: string) {
    const res = await fetch('/api/invitations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitation_id: invitationId, action: 'revoke' }),
    });
    if (!res.ok) {
      toast.error('Failed to revoke');
      return;
    }
    toast.success('Invitation revoked');
    router.refresh();
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(getInviteUrl(token));
    toast.success('Link copied!');
  }

  const isDev = process.env.NODE_ENV !== 'production';

  function previewBooking(token: string) {
    window.open(
      `${getInviteUrl(token)}?${guestPreviewQuery('booking')}`,
      '_blank'
    );
  }

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    accepted: 'default',
    expired: 'outline',
    revoked: 'destructive',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Invitations</h2>
        <Button size="sm" disabled={rooms.length === 0} asChild>
          <Link href={`/dashboard/${propertySlug}/compose?mode=invite`}>
            Invite a guest
          </Link>
        </Button>
      </div>

      {rooms.length === 0 && (
        <p className="text-sm text-amber-600">
          Add rooms before creating invitations.
        </p>
      )}

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No invitations yet — invite your first guest.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">
                    {inv.guest_name ?? inv.guest_email}
                  </p>
                  <p className="text-sm text-muted-foreground">{inv.guest_email}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant={statusVariant[inv.status] ?? 'outline'}>
                      {inv.status}
                    </Badge>
                    <Badge variant="outline">{inv.type.replace('_', ' ')}</Badge>
                    <Badge variant="outline">
                      {inv.requires_approval === false
                        ? 'Auto-confirm'
                        : 'Approval required'}
                    </Badge>
                  </div>
                  {inv.expires_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Expires {formatDate(inv.expires_at)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {isDev && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewBooking(inv.token)}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      Preview booking
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(inv.token)}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy link
                  </Button>
                  {inv.status !== 'revoked' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => revoke(inv.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
