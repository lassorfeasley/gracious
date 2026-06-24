import { Text } from '@react-email/components';
import { EmailLayout } from './components/layout';
import { FactsCard, VisitDatesCard } from './components/cards';

interface Props {
  guestName: string;
  propertyName: string;
  /** yyyy-MM-dd */
  checkInDate: string;
  /** yyyy-MM-dd */
  checkOutDate: string;
  rooms: string;
}

export default function RequestReceivedEmail({
  guestName,
  propertyName,
  checkInDate,
  checkOutDate,
  rooms,
}: Props) {
  return (
    <EmailLayout
      preview={`Your request for ${propertyName} is in`}
      heading="Your request is in"
    >
      <Text>Hi {guestName},</Text>
      <Text>
        We&apos;ve passed your visit request along to the hosts of{' '}
        <strong>{propertyName}</strong>. You&apos;ll get an email as soon as
        they respond.
      </Text>

      <VisitDatesCard checkInDate={checkInDate} checkOutDate={checkOutDate} />

      <FactsCard facts={[{ label: 'Rooms', value: rooms }]} />

      <Text>No need to do anything in the meantime — sit tight!</Text>
    </EmailLayout>
  );
}
