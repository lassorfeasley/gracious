import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';

interface Props {
  guestName: string;
  propertyName: string;
  dates: string;
  rooms: string;
  partySize: number;
  notes?: string;
  approveUrl: string;
  declineUrl: string;
}

export default function StayRequestedEmail({
  guestName,
  propertyName,
  dates,
  rooms,
  partySize,
  notes,
  approveUrl,
  declineUrl,
}: Props) {
  return (
    <EmailLayout
      preview={`${guestName} requested a stay at ${propertyName}`}
      heading="New stay request"
    >
      <Text>
        <strong>{guestName}</strong> has requested a stay at{' '}
        <strong>{propertyName}</strong>.
      </Text>
      <Text>
        <strong>Dates:</strong> {dates}
        <br />
        <strong>Rooms:</strong> {rooms}
        <br />
        <strong>Party size:</strong> {partySize}
      </Text>
      {notes && <Text><strong>Note:</strong> {notes}</Text>}
      <div style={{ marginTop: '24px' }}>
        <Button style={{ ...buttonStyle, marginRight: '12px' }} href={approveUrl}>
          Approve
        </Button>
        <Button
          style={{ ...buttonStyle, backgroundColor: '#fff', color: '#111', border: '1px solid #ddd' }}
          href={declineUrl}
        >
          Decline
        </Button>
      </div>
    </EmailLayout>
  );
}
