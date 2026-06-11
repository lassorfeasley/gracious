import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';
import { EmailHero } from './components/hero';
import { EmailCalendarLinks } from './components/calendar-links';
import { EmailSection, FactsCard, StayDatesCard } from './components/cards';

interface Props {
  guestName: string;
  propertyName: string;
  /** yyyy-MM-dd */
  checkInDate: string;
  /** yyyy-MM-dd */
  checkOutDate: string;
  daysUntil: number;
  /** Check-in instructions (prose), included on the 1-day reminder. */
  checkIn?: string;
  address?: string;
  wifiName?: string;
  wifiPassword?: string;
  profileUrl?: string;
  unsubscribeUrl?: string;
  /** Featured property photo, shown as a banner above the heading. */
  heroImageUrl?: string;
  /** Pre-filled add-to-calendar links. */
  googleCalendarUrl?: string;
  outlookCalendarUrl?: string;
}

export default function TripReminderEmail({
  guestName,
  propertyName,
  checkInDate,
  checkOutDate,
  daysUntil,
  checkIn,
  address,
  wifiName,
  wifiPassword,
  profileUrl,
  unsubscribeUrl,
  heroImageUrl,
  googleCalendarUrl,
  outlookCalendarUrl,
}: Props) {
  const heading =
    daysUntil <= 1
      ? 'Your trip starts tomorrow!'
      : `Your trip is in ${daysUntil} days`;

  return (
    <EmailLayout
      preview={heading}
      heading={heading}
      unsubscribeUrl={unsubscribeUrl}
      hero={<EmailHero propertyName={propertyName} imageUrl={heroImageUrl} />}
    >
      <Text>Hi {guestName},</Text>
      <Text>
        Just a reminder — your stay at <strong>{propertyName}</strong> is
        coming up.
      </Text>

      <StayDatesCard checkInDate={checkInDate} checkOutDate={checkOutDate} />

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

      {daysUntil <= 1 && checkIn && (
        <EmailSection title="Check-in instructions">
          <Text style={{ margin: '0' }}>{checkIn}</Text>
        </EmailSection>
      )}

      {googleCalendarUrl && outlookCalendarUrl && (
        <EmailCalendarLinks
          googleUrl={googleCalendarUrl}
          outlookUrl={outlookCalendarUrl}
        />
      )}
      {profileUrl && (
        <Button style={buttonStyle} href={profileUrl}>
          View house details
        </Button>
      )}
    </EmailLayout>
  );
}
