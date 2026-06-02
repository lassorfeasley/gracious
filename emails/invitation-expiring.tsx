import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';

interface Props {
  ownerName: string;
  invitations: { guestName: string; propertyName: string; expiresAt: string }[];
  dashboardUrl: string;
}

export default function InvitationExpiringEmail({
  ownerName,
  invitations,
  dashboardUrl,
}: Props) {
  return (
    <EmailLayout
      preview="Invitations expiring in 48 hours"
      heading="Invitations expiring soon"
    >
      <Text>Hi {ownerName},</Text>
      <Text>The following invitations expire within 48 hours:</Text>
      {invitations.map((inv, i) => (
        <Text key={i}>
          • <strong>{inv.guestName}</strong> — {inv.propertyName} (expires{' '}
          {inv.expiresAt})
        </Text>
      ))}
      <Button style={buttonStyle} href={dashboardUrl}>
        Manage invitations
      </Button>
    </EmailLayout>
  );
}
