import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';

interface Props {
  recipientName: string;
  guestName: string;
  propertyName: string;
  dates: string;
  cancelledBy: 'guest' | 'owner';
  /**
   * Guest variant only: when their invitation is still open, link them to
   * request new dates so the cancellation isn't a dead end.
   */
  inviteUrl?: string;
  unsubscribeUrl?: string;
}

export default function VisitCancelledEmail({
  recipientName,
  guestName,
  propertyName,
  dates,
  cancelledBy,
  inviteUrl,
  unsubscribeUrl,
}: Props) {
  const isOwnerRecipient = cancelledBy === 'guest';
  return (
    <EmailLayout
      preview={`Visit cancelled at ${propertyName}`}
      heading="Visit cancelled"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text>Hi {recipientName},</Text>
      {isOwnerRecipient ? (
        <Text>
          <strong>{guestName}</strong> has cancelled their visit at{' '}
          <strong>{propertyName}</strong> ({dates}).
        </Text>
      ) : (
        <Text>
          Your visit at <strong>{propertyName}</strong> ({dates}) has been
          cancelled by the host.
        </Text>
      )}
      {!isOwnerRecipient && inviteUrl && (
        <>
          <Text>
            Your invitation is still open — you&apos;re welcome to request
            different dates whenever you like.
          </Text>
          <Button style={buttonStyle} href={inviteUrl}>
            Pick new dates
          </Button>
        </>
      )}
    </EmailLayout>
  );
}
