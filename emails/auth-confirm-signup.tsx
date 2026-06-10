import { Button, Link, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';

interface Props {
  confirmUrl: string;
  token?: string;
}

export default function AuthConfirmSignupEmail({ confirmUrl, token }: Props) {
  return (
    <EmailLayout
      preview="Confirm your email to finish setting up Gracious"
      heading="Confirm your email"
    >
      <Text>
        Welcome to Gracious! Confirm this email address to finish setting up
        your account.
      </Text>
      <Button style={buttonStyle} href={confirmUrl}>
        Confirm email
      </Button>
      {token && (
        <Text style={{ fontSize: '14px', color: '#444', marginTop: '16px' }}>
          Or enter this code: <strong>{token}</strong>
        </Text>
      )}
      <Text style={{ fontSize: '12px', color: '#999', marginTop: '16px' }}>
        This link expires soon and can only be used once. If you didn&apos;t
        create a Gracious account, you can safely ignore this email.
        <br />
        Or copy this link: <Link href={confirmUrl}>{confirmUrl}</Link>
      </Text>
    </EmailLayout>
  );
}
