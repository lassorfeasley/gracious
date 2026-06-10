import { Button, Link, Text } from '@react-email/components';
import { EmailLayout, buttonStyle, fallbackLinkStyle } from './components/layout';

interface Props {
  guestName: string;
  /** The person extending the invitation; omit to fall back to neutral copy. */
  hostName?: string;
  propertyName: string;
  inviteUrl: string;
  message?: string;
  expiresAt?: string;
}

export default function InvitationSentEmail({
  guestName,
  hostName,
  propertyName,
  inviteUrl,
  message,
  expiresAt,
}: Props) {
  const headline = hostName
    ? `${hostName} has invited you to ${propertyName}`
    : `You're invited to ${propertyName}`;
  return (
    <EmailLayout preview={headline} heading={headline}>
      <Text>Hi {guestName},</Text>
      <Text>
        {hostName ? (
          <>
            <strong>{hostName}</strong> has invited you to stay at{' '}
            <strong>{propertyName}</strong>.
          </>
        ) : (
          <>
            You&apos;ve been invited to request a stay at{' '}
            <strong>{propertyName}</strong>.
          </>
        )}
      </Text>
      {message && <Text style={{ fontStyle: 'italic' }}>&ldquo;{message}&rdquo;</Text>}
      {expiresAt && (
        <Text>This invitation expires on {expiresAt}.</Text>
      )}
      <Button style={buttonStyle} href={inviteUrl}>
        View house & request stay
      </Button>
      <Text style={{ fontSize: '12px', color: '#8a8273', marginTop: '16px' }}>
        Or copy this link:{' '}
        <Link href={inviteUrl} style={fallbackLinkStyle}>
          {inviteUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}
