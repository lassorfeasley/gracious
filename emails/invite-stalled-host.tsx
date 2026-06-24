import { Link, Text } from '@react-email/components';
import { EmailLayout } from './components/layout';
import { PersonCard } from './components/cards';

interface StalledInvite {
  guestName: string;
  /** Used to address the forward and seed the avatar color. */
  guestEmail: string;
  propertyName: string;
  /** Public guest link, embedded in the forward draft (never shown raw). */
  inviteUrl: string;
}

interface Props {
  ownerName: string;
  invitations: StalledInvite[];
  dashboardUrl: string;
  unsubscribeUrl?: string;
}

const manageLinkStyle = {
  color: '#1f3d33',
  fontWeight: '600' as const,
  textDecoration: 'underline',
};

/**
 * Build a `mailto:` that opens the host's mail app with a friendly,
 * ready-to-send forward of the invite. The body is plain text (mailto can't
 * carry HTML) and uses \r\n so every client renders the line breaks.
 */
function forwardMailto(inv: StalledInvite, ownerName: string): string {
  const firstName = inv.guestName.split(/\s+/)[0] || inv.guestName;
  const subject = `Your invite to ${inv.propertyName}`;
  const body = [
    `Hi ${firstName},`,
    '',
    `Resharing your invite to ${inv.propertyName} — I'd really love for you to come.`,
    'You can see the details and pick your dates here:',
    '',
    inv.inviteUrl,
    '',
    'Hope you can make it!',
    ownerName,
  ].join('\r\n');
  return `mailto:${inv.guestEmail}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
}

export default function InviteStalledHostEmail({
  ownerName,
  invitations,
  dashboardUrl,
  unsubscribeUrl,
}: Props) {
  const isPlural = invitations.length > 1;
  return (
    <EmailLayout
      preview="Some guests haven't opened their invite"
      heading={
        isPlural
          ? "A few guests haven't opened their invite"
          : "A guest hasn't opened their invite"
      }
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text>Hi {ownerName},</Text>
      <Text>
        {isPlural ? 'These guests' : 'This guest'} still haven&apos;t responded
        after a few reminders. Email sometimes gets buried — the fastest fix is
        to send it again yourself. Tap below and we&apos;ll draft the message
        for you.
      </Text>
      {invitations.map((inv, i) => {
        const firstName = inv.guestName.split(/\s+/)[0] || inv.guestName;
        return (
          <PersonCard
            key={i}
            name={inv.guestName}
            email={inv.guestEmail}
            statusLine={`Hasn't opened their invite to ${inv.propertyName}`}
            actionHref={forwardMailto(inv, ownerName)}
            actionLabel={`Forward invite to ${firstName}`}
          />
        );
      })}
      <Text style={{ margin: '24px 0 0' }}>
        <Link href={dashboardUrl} style={manageLinkStyle}>
          Manage all invitations &rarr;
        </Link>
      </Text>
    </EmailLayout>
  );
}
