import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';
import { HostInviteFooter } from './components/footer';

interface Props {
  guestName: string;
  propertyName: string;
  hostName?: string;
  profileUrl?: string;
  unsubscribeUrl?: string;
  /** True when the recipient already hosts; hides the "become a host" aside. */
  recipientIsHost?: boolean;
  /** Authenticated deep link for the "become a host" aside. */
  hostOnboardingUrl?: string;
}

export default function PostStayThankYouEmail({
  guestName,
  propertyName,
  hostName,
  profileUrl,
  unsubscribeUrl,
  recipientIsHost = false,
  hostOnboardingUrl,
}: Props) {
  return (
    <EmailLayout
      preview={`Thanks for staying at ${propertyName}`}
      heading="Thanks for staying with us"
      unsubscribeUrl={unsubscribeUrl}
      footerAside={
        <HostInviteFooter
          recipientIsHost={recipientIsHost}
          href={hostOnboardingUrl}
        />
      }
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
