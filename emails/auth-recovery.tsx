import { Button, Link, Text } from '@react-email/components';
import { EmailLayout, buttonStyle, fallbackLinkStyle } from './components/layout';

interface Props {
  resetUrl: string;
  token?: string;
}

export default function AuthRecoveryEmail({ resetUrl, token }: Props) {
  return (
    <EmailLayout
      preview="Reset your Gracious password"
      heading="Reset your password"
    >
      <Text>
        We received a request to reset your Gracious password. Click below to
        choose a new one.
      </Text>
      <Button style={buttonStyle} href={resetUrl}>
        Reset password
      </Button>
      {token && (
        <Text style={{ fontSize: '14px', color: '#444', marginTop: '16px' }}>
          Or enter this code: <strong>{token}</strong>
        </Text>
      )}
      <Text style={{ fontSize: '12px', color: '#8a8273', marginTop: '16px' }}>
        This link expires soon and can only be used once. If you didn&apos;t
        request a password reset, you can safely ignore this email — your
        password won&apos;t change.
        <br />
        Or copy this link:{' '}
        <Link href={resetUrl} style={fallbackLinkStyle}>
          {resetUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}
