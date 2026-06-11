import { Button, Link, Text } from '@react-email/components';
import { EmailLayout, buttonStyle, fallbackLinkStyle } from './components/layout';
import { EmailHero } from './components/hero';
import { QuoteCard } from './components/cards';

interface Props {
  guestName: string;
  /** The person extending the invitation; omit to fall back to neutral copy. */
  hostName?: string;
  propertyName: string;
  inviteUrl: string;
  message?: string;
  expiresAt?: string;
  /** Featured property photo, shown as a banner above the heading. */
  heroImageUrl?: string;
}

export default function InvitationSentEmail({
  guestName,
  hostName,
  propertyName,
  inviteUrl,
  message,
  expiresAt,
  heroImageUrl,
}: Props) {
  const headline = hostName
    ? `${hostName} has invited you to ${propertyName}`
    : `You're invited to ${propertyName}`;
  return (
    <EmailLayout
      preview={headline}
      heading={headline}
      hero={<EmailHero propertyName={propertyName} imageUrl={heroImageUrl} />}
    >
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
      {message && <QuoteCard attribution={hostName}>{message}</QuoteCard>}
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
