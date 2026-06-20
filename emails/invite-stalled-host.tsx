import { Button, Link, Text } from '@react-email/components';
import { EmailLayout, buttonStyle, fallbackLinkStyle } from './components/layout';

interface StalledInvite {
  guestName: string;
  propertyName: string;
  /** Public guest link the host can copy and share directly. */
  inviteUrl: string;
}

interface Props {
  ownerName: string;
  invitations: StalledInvite[];
  dashboardUrl: string;
  unsubscribeUrl?: string;
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
        {isPlural ? 'These guests' : 'This guest'} still hasn&apos;t responded
        after a few reminders. Email sometimes gets buried — often the fastest
        fix is to text or message {isPlural ? 'them' : 'them'} the link yourself.
      </Text>
      {invitations.map((inv, i) => (
        <Text key={i} style={{ marginBottom: '4px' }}>
          • <strong>{inv.guestName}</strong> — {inv.propertyName}
          <br />
          <Link href={inv.inviteUrl} style={fallbackLinkStyle}>
            {inv.inviteUrl}
          </Link>
        </Text>
      ))}
      <Button style={buttonStyle} href={dashboardUrl}>
        Manage invitations
      </Button>
    </EmailLayout>
  );
}
