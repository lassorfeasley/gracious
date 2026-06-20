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
  /** Which nudge this is (1 = first reminder … 3 = last call). */
  step: 1 | 2 | 3;
  /** True when the recipient already hosts; hides the "become a host" aside. */
  recipientIsHost?: boolean;
  /** Authenticated deep link for the "become a host" aside. */
  hostOnboardingUrl?: string;
}

export default function InviteReminderEmail({
  guestName,
  hostName,
  propertyName,
  inviteUrl,
  message,
  expiresAt,
  heroImageUrl,
  step,
  recipientIsHost = false,
  hostOnboardingUrl,
}: Props) {
  const isFinal = step >= 3;
  const headline = isFinal
    ? `Last reminder: your invite to ${propertyName}`
    : `Your invite to ${propertyName} is waiting`;

  const lead = hostName ? (
    <>
      <strong>{hostName}</strong> invited you to stay at{' '}
      <strong>{propertyName}</strong>
    </>
  ) : (
    <>
      You&apos;ve been invited to request a stay at{' '}
      <strong>{propertyName}</strong>
    </>
  );

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
        Just a friendly nudge — {lead}, and we haven&apos;t heard back yet.
      </Text>
      {message && <QuoteCard attribution={hostName}>{message}</QuoteCard>}
      {isFinal ? (
        <Text>
          This is the last reminder we&apos;ll send. Whenever you&apos;re ready,
          picking your dates only takes a minute.
        </Text>
      ) : (
        <Text>Pick your dates whenever you&apos;re ready — it only takes a minute.</Text>
      )}
      {expiresAt && <Text>This invitation expires on {expiresAt}.</Text>}
      <Button style={buttonStyle} href={inviteUrl}>
        View house &amp; request stay
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
