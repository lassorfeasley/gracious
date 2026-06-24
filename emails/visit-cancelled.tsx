import { Text } from '@react-email/components';
import { EmailLayout } from './components/layout';

interface Props {
  recipientName: string;
  guestName: string;
  propertyName: string;
  dates: string;
  cancelledBy: 'guest' | 'owner';
  unsubscribeUrl?: string;
}

export default function VisitCancelledEmail({
  recipientName,
  guestName,
  propertyName,
  dates,
  cancelledBy,
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
    </EmailLayout>
  );
}
