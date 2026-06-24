import { Link, Text } from '@react-email/components';
import * as React from 'react';

/*
 * Email clients need absolute URLs. Read the app origin directly from the
 * environment (not via the `@/` alias) so the react-email preview CLI — which
 * doesn't resolve TS path aliases — can still render this.
 */
const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://gracious.host';

interface HostInviteFooterProps {
  /**
   * True when the recipient is already a host — i.e. their role is owner, OR
   * they manage / co-manage any home. When true, this renders nothing.
   */
  recipientIsHost: boolean;
  /**
   * Where "Add your home to get started" points: the first page of the
   * add-a-house flow.
   *
   * Defaults to /signup (the public onboarding wizard, which builds the home
   * first and creates the account last). To pair a guest's existing account
   * automatically, the caller should instead pass an authenticated deep link
   * (token_hash magic link → /auth/confirm with next=/dashboard) generated
   * per-recipient in the notification layer; landing already signed-in lets
   * the new home attach to their current account and sidesteps a duplicate.
   */
  href?: string;
}

/**
 * A quiet, fine-print CTA — shown only on relationship emails (invitation,
 * visit confirmed, post-visit follow-up) — gently inviting a guest to open a
 * home of their own. Sits below the main footer divider. Never shown to people
 * who already host, and never on high-urgency functional emails.
 */
export function HostInviteFooter({
  recipientIsHost,
  href = `${baseUrl}/signup`,
}: HostInviteFooterProps) {
  if (recipientIsHost) return null;

  return (
    <Text style={aside}>
      Want to host via Gracious?
      <br />
      <Link href={href} style={asideLink}>
        Add your home to get started.
      </Link>
    </Text>
  );
}

const aside = {
  color: '#8a8273',
  fontSize: '12px',
  lineHeight: '20px',
  margin: '16px 0 0',
};

const asideLink = {
  color: '#8a8273',
  textDecoration: 'underline',
};
