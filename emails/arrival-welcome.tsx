import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';
import { EmailHero } from './components/hero';
import { EmailSection, FactsCard } from './components/cards';

interface Props {
  guestName: string;
  propertyName: string;
  checkIn?: string;
  address?: string;
  directions?: string;
  wifiName?: string;
  wifiPassword?: string;
  profileUrl?: string;
  unsubscribeUrl?: string;
  /** Featured property photo, shown as a banner above the heading. */
  heroImageUrl?: string;
}

export default function ArrivalWelcomeEmail({
  guestName,
  propertyName,
  checkIn,
  address,
  directions,
  wifiName,
  wifiPassword,
  profileUrl,
  unsubscribeUrl,
  heroImageUrl,
}: Props) {
  return (
    <EmailLayout
      preview={`Today's the day — here's how to get into ${propertyName}`}
      heading="Welcome — here's how to get in"
      unsubscribeUrl={unsubscribeUrl}
      hero={<EmailHero propertyName={propertyName} imageUrl={heroImageUrl} />}
    >
      <Text>Hi {guestName},</Text>
      <Text>
        Today&apos;s the day! Everything you need for arriving at{' '}
        <strong>{propertyName}</strong> is below.
      </Text>

      <FactsCard
        facts={[
          { label: 'Address', value: address },
          {
            label: 'WiFi',
            value: wifiName
              ? `${wifiName}${wifiPassword ? ` · Password: ${wifiPassword}` : ''}`
              : undefined,
          },
        ]}
      />

      {checkIn && (
        <EmailSection title="Getting in">
          <Text style={{ margin: '0' }}>{checkIn}</Text>
        </EmailSection>
      )}
      {directions && (
        <EmailSection title="Directions">
          <Text style={{ margin: '0' }}>{directions}</Text>
        </EmailSection>
      )}

      {profileUrl && (
        <Button style={buttonStyle} href={profileUrl}>
          View house details
        </Button>
      )}
      <Text>Safe travels — see you soon!</Text>
    </EmailLayout>
  );
}
