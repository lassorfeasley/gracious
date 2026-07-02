import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';
import { QuoteCard } from './components/cards';

interface Props {
  guestName: string;
  /** The host who declined; omit to fall back to neutral copy. */
  hostName?: string;
  propertyName: string;
  dates: string;
  message?: string;
  inviteUrl: string;
}

/**
 * A decline between friends or family is a delicate moment — the copy leads
 * with "the dates didn't work" rather than a verdict, and points straight at
 * the fix (requesting different dates).
 */
export default function VisitDeclinedEmail({
  guestName,
  hostName,
  propertyName,
  dates,
  message,
  inviteUrl,
}: Props) {
  const hostFirstName = hostName?.trim().split(/\s+/)[0];

  return (
    <EmailLayout
      preview={`Those dates didn't work out — ${propertyName}`}
      heading="Those dates didn’t work out"
      logoPlacement="footer"
    >
      <Text>
        Hi {guestName} —{' '}
        {hostFirstName ? <strong>{hostFirstName}</strong> : 'your host'}{' '}
        couldn&apos;t make your requested dates at{' '}
        <strong>{propertyName}</strong> ({dates}) work this time.
      </Text>
      {message && <QuoteCard attribution={hostName}>{message}</QuoteCard>}
      <Text>
        Your invitation is still open — you&apos;re welcome to pick different
        dates whenever suits you.
      </Text>
      <Button style={buttonStyle} href={inviteUrl}>
        Pick new dates
      </Button>
    </EmailLayout>
  );
}
