import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';

interface Props {
  guestName: string;
  propertyName: string;
  hostName?: string;
  profileUrl?: string;
  unsubscribeUrl?: string;
}

export default function PostStayThankYouEmail({
  guestName,
  propertyName,
  hostName,
  profileUrl,
  unsubscribeUrl,
}: Props) {
  return (
    <EmailLayout
      preview={`Thanks for staying at ${propertyName}`}
      heading="Thanks for staying with us"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text>Hi {guestName},</Text>
      <Text>
        Thank you for staying at <strong>{propertyName}</strong>. We hope you
        had a wonderful time and made some great memories.
      </Text>
      <Text>
        {hostName ? `${hostName} would` : 'We would'} love to host you again
        whenever you&apos;d like to come back.
      </Text>
      {profileUrl && (
        <Button style={buttonStyle} href={profileUrl}>
          View the house
        </Button>
      )}
    </EmailLayout>
  );
}
