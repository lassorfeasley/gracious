import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';
import { FactsCard, QuoteCard, StayDatesCard } from './components/cards';

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
  bookingUrl: string;
  unsubscribeUrl?: string;
}

export default function StayBookedEmail({
  guestName,
  propertyName,
  checkInDate,
  checkOutDate,
  rooms,
  partySize,
  notes,
  bookingUrl,
  unsubscribeUrl,
}: Props) {
  return (
    <EmailLayout
      preview={`${guestName} booked a stay at ${propertyName}`}
      heading="New stay booked"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text>
        <strong>{guestName}</strong> just booked a stay at{' '}
        <strong>{propertyName}</strong>. Their invitation didn&apos;t require
        approval, so the booking is confirmed and on your calendar.
      </Text>

      <StayDatesCard checkInDate={checkInDate} checkOutDate={checkOutDate} />

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

      <Button style={buttonStyle} href={bookingUrl}>
        View booking
      </Button>
    </EmailLayout>
  );
}
