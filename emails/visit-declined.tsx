import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';

interface Props {
  guestName: string;
  propertyName: string;
  dates: string;
  message?: string;
  inviteUrl: string;
}

export default function VisitDeclinedEmail({
  guestName,
  propertyName,
  dates,
  message,
  inviteUrl,
}: Props) {
  return (
    <EmailLayout
      preview={`Your visit request at ${propertyName} was declined`}
      heading="Visit request declined"
    >
      <Text>Hi {guestName},</Text>
      <Text>
        Unfortunately, your request to stay at <strong>{propertyName}</strong>{' '}
        ({dates}) was not approved.
      </Text>
      {message && <Text><strong>Message from host:</strong> {message}</Text>}
      <Text>You can submit a new request if dates become available.</Text>
      <Button style={buttonStyle} href={inviteUrl}>
        View invitation
      </Button>
    </EmailLayout>
  );
}
