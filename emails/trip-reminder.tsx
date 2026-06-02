import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';

interface Props {
  guestName: string;
  propertyName: string;
  dates: string;
  daysUntil: number;
  checkIn?: string;
  address?: string;
  wifiName?: string;
  wifiPassword?: string;
  profileUrl: string;
}

export default function TripReminderEmail({
  guestName,
  propertyName,
  dates,
  daysUntil,
  checkIn,
  address,
  wifiName,
  wifiPassword,
  profileUrl,
}: Props) {
  const heading =
    daysUntil <= 1
      ? 'Your trip starts tomorrow!'
      : `Your trip is in ${daysUntil} days`;

  return (
    <EmailLayout preview={heading} heading={heading}>
      <Text>Hi {guestName},</Text>
      <Text>
        Just a reminder — your stay at <strong>{propertyName}</strong> is
        coming up ({dates}).
      </Text>
      {daysUntil <= 1 && checkIn && (
        <Text><strong>Check-in instructions:</strong> {checkIn}</Text>
      )}
      {address && <Text><strong>Address:</strong> {address}</Text>}
      {wifiName && (
        <Text>
          <strong>WiFi:</strong> {wifiName}
          {wifiPassword ? ` / ${wifiPassword}` : ''}
        </Text>
      )}
      <Button style={buttonStyle} href={profileUrl}>
        View house details
      </Button>
    </EmailLayout>
  );
}
