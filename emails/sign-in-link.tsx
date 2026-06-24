import { Button, Link, Text } from '@react-email/components';
import { EmailLayout, buttonStyle, fallbackLinkStyle } from './components/layout';

interface Props {
  propertyName: string;
  signInUrl: string;
}

export default function SignInLinkEmail({ propertyName, signInUrl }: Props) {
  return (
    <EmailLayout
      preview={`Your sign-in link for ${propertyName}`}
      heading="Your sign-in link"
    >
      <Text>
        Click below to sign in and continue to your visit at{' '}
        <strong>{propertyName}</strong>.
      </Text>
      <Button style={buttonStyle} href={signInUrl}>
        Sign in & continue
      </Button>
      <Text style={{ fontSize: '12px', color: '#8a8273', marginTop: '16px' }}>
        This link can only be used once and expires soon. If it doesn&apos;t
        work, request a new one.
        <br />
        Or copy this link:{' '}
        <Link href={signInUrl} style={fallbackLinkStyle}>
          {signInUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}
