import { Button, Text } from '@react-email/components';
import { EmailLayout, ctaButtonStyle } from './components/layout';
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
  /** Featured property photo, shown as a banner below the copy. */
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
  // hostName arrives as a real full name or not at all; first name keeps the
  // headline personal and tight.
  const hostFirstName = hostName?.trim().split(/\s+/)[0];

  const preview = hostFirstName
    ? `Plan your visit with ${hostFirstName} at ${propertyName}`
    : `Plan your visit to ${propertyName}`;

  const heading = hostFirstName ? (
    <>
      Plan your visit with <span style={nameStyle}>{hostFirstName}</span> at{' '}
      <span style={nameStyle}>{propertyName}</span>
    </>
  ) : (
    <>
      Plan your visit to <span style={nameStyle}>{propertyName}</span>
    </>
  );

  return (
    <EmailLayout
      preview={preview}
      heading={heading}
      logoPlacement="footer"
      footerAside={
        <HostInviteFooter
          recipientIsHost={recipientIsHost}
          href={hostOnboardingUrl}
        />
      }
    >
      <Button style={ctaButtonStyle} href={inviteUrl}>
        Pick your dates
      </Button>
      <Text>
        Hi {guestName} —{' '}
        {hostFirstName ? <strong>{hostFirstName}</strong> : 'your host'} set
        aside a spot for you at <strong>{propertyName}</strong>. Choose the dates
        that work for you and we&apos;ll send your request along — it only takes
        a minute, and nothing&apos;s held until you pick them.
      </Text>
      {message && <QuoteCard attribution={hostName}>{message}</QuoteCard>}
      <EmailHero propertyName={propertyName} imageUrl={heroImageUrl} />
      {expiresAt && (
        <Text style={finePrint}>This invitation expires on {expiresAt}.</Text>
      )}
    </EmailLayout>
  );
}

const nameStyle = { color: '#a2773e' };
const finePrint = { fontSize: '12px', color: '#8a8273', marginTop: '16px' };
