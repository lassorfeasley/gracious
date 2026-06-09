import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';

interface Props {
  hostName: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  unsubscribeUrl?: string;
}

export default function ProductUpdateEmail({
  hostName,
  headline,
  body,
  ctaLabel,
  ctaUrl,
  unsubscribeUrl,
}: Props) {
  return (
    <EmailLayout
      preview={headline}
      heading={headline}
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text>Hi {hostName},</Text>
      <Text>{body}</Text>
      {ctaLabel && ctaUrl && (
        <Button style={buttonStyle} href={ctaUrl}>
          {ctaLabel}
        </Button>
      )}
    </EmailLayout>
  );
}
