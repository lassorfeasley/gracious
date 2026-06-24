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
  visitUrl: string;
  unsubscribeUrl?: string;
}

export default function StayConfirmedEmail({
  guestName,
  propertyName,
  checkInDate,
  checkOutDate,
  rooms,
  partySize,
  notes,
  visitUrl,
  unsubscribeUrl,
}: Props) {
  return (
    <EmailLayout
      preview={`${guestName} confirmed a visit at ${propertyName}`}
      heading="New visit confirmed"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text>
        <strong>{guestName}</strong> just confirmed a visit at{' '}
        <strong>{propertyName}</strong>. Their invitation didn&apos;t require
        approval, so the visit is confirmed and on your calendar.
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

      <Button style={buttonStyle} href={visitUrl}>
        View visit
      </Button>
    </EmailLayout>
  );
}
