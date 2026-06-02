import { Button, Link, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';

interface Props {
  guestName: string;
  propertyName: string;
  inviteUrl: string;
  message?: string;
  expiresAt?: string;
}

export default function InvitationSentEmail({
  guestName,
  propertyName,
  inviteUrl,
  message,
  expiresAt,
}: Props) {
  return (
    <EmailLayout
      preview={`You're invited to ${propertyName}`}
      heading={`You're invited to ${propertyName}`}
    >
      <Text>Hi {guestName},</Text>
      <Text>
        You&apos;ve been invited to request a stay at <strong>{propertyName}</strong>.
      </Text>
      {message && <Text style={{ fontStyle: 'italic' }}>&ldquo;{message}&rdquo;</Text>}
      {expiresAt && (
        <Text>This invitation expires on {expiresAt}.</Text>
      )}
      <Button style={buttonStyle} href={inviteUrl}>
        View house & request stay
      </Button>
      <Text style={{ fontSize: '12px', color: '#999', marginTop: '16px' }}>
        Or copy this link: <Link href={inviteUrl}>{inviteUrl}</Link>
      </Text>
    </EmailLayout>
  );
}
