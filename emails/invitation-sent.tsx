import { Button, Link, Text } from '@react-email/components';
import { EmailLayout, buttonStyle, fallbackLinkStyle } from './components/layout';
import { EmailHero } from './components/hero';
import { QuoteCard } from './components/cards';
import { HostInviteFooter } from './components/footer';

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
  /** True when the recipient already hosts; hides the "become a host" aside. */
  recipientIsHost?: boolean;
  /** Authenticated deep link for the "become a host" aside. */
  hostOnboardingUrl?: string;
}

export default function InvitationSentEmail({
  guestName,
  hostName,
  propertyName,
  inviteUrl,
  message,
  expiresAt,
  heroImageUrl,
  recipientIsHost = false,
  hostOnboardingUrl,
}: Props) {
  const headline = hostName
    ? `${hostName} has invited you to ${propertyName}`
    : `You're invited to ${propertyName}`;
  return (
    <EmailLayout
      preview={headline}
      heading={headline}
      hero={<EmailHero propertyName={propertyName} imageUrl={heroImageUrl} />}
      footerAside={
        <HostInviteFooter
          recipientIsHost={recipientIsHost}
          href={hostOnboardingUrl}
        />
      }
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
            You&apos;ve been invited to request a visit at{' '}
            <strong>{propertyName}</strong>.
          </>
        )}
      </Text>
      {message && <QuoteCard attribution={hostName}>{message}</QuoteCard>}
      {expiresAt && (
        <Text>This invitation expires on {expiresAt}.</Text>
      )}
      <Button style={buttonStyle} href={inviteUrl}>
        View house & request a visit
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
