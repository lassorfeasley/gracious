'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy, Eye, ExternalLink } from 'lucide-react';
import { getInviteUrl } from '@/lib/invite-url';
import { guestPreviewQuery } from '@/lib/guest-preview';
import { CancelHostStayButton } from '@/components/dashboard/cancel-host-stay-button';

interface GuestProfileActionsProps {
  invitationToken?: string | null;
  invitationId?: string | null;
  invitationStatus?: string;
  manualBookingId?: string | null;
  invitePageHref?: string;
}

export function GuestProfileActions({
  invitationToken,
  invitationId,
  invitationStatus,
  manualBookingId,
  invitePageHref,
}: GuestProfileActionsProps) {
  const router = useRouter();
  const isDev = process.env.NODE_ENV !== 'production';

  function copyLink() {
    if (!invitationToken) return;
    navigator.clipboard.writeText(getInviteUrl(invitationToken));
    toast.success('Invite link copied');
  }

  async function revoke() {
    if (!invitationId) return;
    if (!window.confirm('Revoke this invitation? The link will stop working.')) {
      return;
    }
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

  return (
    <div className="flex flex-wrap gap-2">
      {invitePageHref && (
        <Button variant="outline" size="sm" asChild>
          <Link href={invitePageHref} target="_blank">
            <ExternalLink className="mr-1 h-4 w-4" />
            Open invite page
          </Link>
        </Button>
      )}
      {invitationToken && invitationStatus !== 'revoked' && (
        <>
          <Button variant="outline" size="sm" onClick={copyLink}>
            <Copy className="mr-1 h-4 w-4" />
            Copy invite link
          </Button>
          {isDev && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`${getInviteUrl(invitationToken)}?${guestPreviewQuery('booking')}`}
                target="_blank"
                rel="noreferrer"
              >
                <Eye className="mr-1 h-4 w-4" />
                Preview booking
              </a>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={revoke}
          >
            Revoke invitation
          </Button>
        </>
      )}
      {manualBookingId && (
        <CancelHostStayButton bookingId={manualBookingId} />
      )}
    </div>
  );
}
