import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';

interface Props {
  guestName: string;
  propertyName: string;
  dates: string;
  rooms: string;
  address?: string;
  directions?: string;
  wifiName?: string;
  wifiPassword?: string;
  checkIn?: string;
  houseRules?: string;
  coguestNote?: string;
  profileUrl: string;
}

export default function BookingApprovedEmail(props: Props) {
  return (
    <EmailLayout
      preview={`Your stay at ${props.propertyName} is confirmed`}
      heading="Your stay is confirmed!"
    >
      <Text>Hi {props.guestName},</Text>
      <Text>
        Your stay at <strong>{props.propertyName}</strong> has been approved.
      </Text>
      <Text>
        <strong>Dates:</strong> {props.dates}
        <br />
        <strong>Rooms:</strong> {props.rooms}
      </Text>
      {props.address && <Text><strong>Address:</strong> {props.address}</Text>}
      {props.directions && <Text><strong>Directions:</strong> {props.directions}</Text>}
      {props.wifiName && (
        <Text>
          <strong>WiFi:</strong> {props.wifiName}
          {props.wifiPassword ? ` / Password: ${props.wifiPassword}` : ''}
        </Text>
      )}
      {props.checkIn && <Text><strong>Check-in:</strong> {props.checkIn}</Text>}
      {props.houseRules && <Text><strong>House rules:</strong> {props.houseRules}</Text>}
      {props.coguestNote && <Text>{props.coguestNote}</Text>}
      <Text>A calendar file (.ics) is attached to add this stay to your calendar.</Text>
      <Button style={buttonStyle} href={props.profileUrl}>
        View house details
      </Button>
    </EmailLayout>
  );
}
