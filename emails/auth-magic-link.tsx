import { Button, Link, Text } from '@react-email/components';
import { EmailLayout, buttonStyle, fallbackLinkStyle } from './components/layout';

interface Props {
  signInUrl: string;
  token?: string;
}

export default function AuthMagicLinkEmail({ signInUrl, token }: Props) {
  return (
    <EmailLayout
      preview="Your Gracious sign-in link"
      heading="Sign in to Gracious"
    >
      <Text>Click below to securely sign in to your Gracious account.</Text>
      <Button style={buttonStyle} href={signInUrl}>
        Sign in
      </Button>
      {token && (
        <Text style={{ fontSize: '14px', color: '#444', marginTop: '16px' }}>
          Or enter this code: <strong>{token}</strong>
        </Text>
      )}
      <Text style={{ fontSize: '12px', color: '#8a8273', marginTop: '16px' }}>
        This link expires soon and can only be used once. If you didn&apos;t
        request it, you can safely ignore this email.
        <br />
        Or copy this link:{' '}
        <Link href={signInUrl} style={fallbackLinkStyle}>
          {signInUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}
