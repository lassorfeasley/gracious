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
  // hostName arrives as a real full name or not at all; first name keeps the
  // headline personal and tight.
  const hostFirstName = hostName?.trim().split(/\s+/)[0];

  const preview = isFinal
    ? hostFirstName
      ? `Last chance to plan your visit with ${hostFirstName} at ${propertyName}`
      : `Last chance to plan your visit to ${propertyName}`
    : hostFirstName
      ? `Plan your visit with ${hostFirstName} at ${propertyName}`
      : `Plan your visit to ${propertyName}`;

  const heading = isFinal ? (
    hostFirstName ? (
      <>
        Last chance to plan your visit with{' '}
        <span style={nameStyle}>{hostFirstName}</span> at{' '}
        <span style={nameStyle}>{propertyName}</span>
      </>
    ) : (
      <>
        Last chance to plan your visit to{' '}
        <span style={nameStyle}>{propertyName}</span>
      </>
    )
  ) : hostFirstName ? (
    <>
      Plan your visit with <span style={nameStyle}>{hostFirstName}</span> at{' '}
      <span style={nameStyle}>{propertyName}</span>
    </>
  ) : (
    <>
      Plan your visit to <span style={nameStyle}>{propertyName}</span>
    </>
  );

  const host = hostFirstName ? <strong>{hostFirstName}</strong> : 'your host';

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
      {isFinal ? (
        <Text>
          Hi {guestName} — this is the last reminder we&apos;ll send about{' '}
          {hostFirstName ? (
            <>
              <strong>{hostFirstName}</strong>&apos;s
            </>
          ) : (
            'your'
          )}{' '}
          invite to <strong>{propertyName}</strong>. Whenever you&apos;re ready,
          picking your dates only takes a minute.
        </Text>
      ) : (
        <Text>
          Hi {guestName} — {host} invited you to{' '}
          <strong>{propertyName}</strong> and we haven&apos;t heard back yet.
          Choose the dates that work for you whenever you&apos;re ready; it only
          takes a minute.
        </Text>
      )}
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
