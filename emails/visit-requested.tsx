import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';
import { FactsCard, QuoteCard, VisitDatesCard } from './components/cards';

interface Props {
  guestName: string;
  propertyName: string;
  /** yyyy-MM-dd */
  checkInDate: string;
  /** yyyy-MM-dd */
  checkOutDate: string;
  rooms: string;
  partySize: number;
  notes?: string;
  approveUrl: string;
  declineUrl: string;
  unsubscribeUrl?: string;
}

export default function VisitRequestedEmail({
  guestName,
  propertyName,
  checkInDate,
  checkOutDate,
  rooms,
  partySize,
  notes,
  approveUrl,
  declineUrl,
  unsubscribeUrl,
}: Props) {
  return (
    <EmailLayout
      preview={`${guestName} requested a visit at ${propertyName}`}
      heading="New visit request"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text>
        <strong>{guestName}</strong> has requested a visit at{' '}
        <strong>{propertyName}</strong>.
      </Text>

      <VisitDatesCard checkInDate={checkInDate} checkOutDate={checkOutDate} />

      <FactsCard
        facts={[
          { label: 'Rooms', value: rooms },
          {
            label: 'Guests',
            value: `${partySize} ${partySize === 1 ? 'guest' : 'guests'}`,
          },
        ]}
      />

      {notes && <QuoteCard attribution={guestName}>{notes}</QuoteCard>}

      <div style={{ marginTop: '24px' }}>
        <Button style={{ ...buttonStyle, marginRight: '12px' }} href={approveUrl}>
          Approve
        </Button>
        <Button
          style={{
            ...buttonStyle,
            backgroundColor: '#fdfcf8',
            color: '#221e19',
            border: '1px solid #e4ddd0',
          }}
          href={declineUrl}
        >
          Decline
        </Button>
      </div>
    </EmailLayout>
  );
}
