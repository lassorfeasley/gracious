import { Text } from '@react-email/components';
import { EmailLayout } from './components/layout';

interface Props {
  guestName: string;
  propertyName: string;
  checkoutTime?: string;
  checkoutInstructions?: string;
  houseRules?: string;
}

export default function CheckoutInstructionsEmail({
  guestName,
  propertyName,
  checkoutTime,
  checkoutInstructions,
  houseRules,
}: Props) {
  return (
    <EmailLayout
      preview={`Checkout details for your stay at ${propertyName}`}
      heading="Time to head out"
    >
      <Text>Hi {guestName},</Text>
      <Text>
        We hope you enjoyed your stay at <strong>{propertyName}</strong>. Here
        are a few things to take care of before you go
        {checkoutTime ? ` — checkout is at ${checkoutTime}` : ''}.
      </Text>
      {checkoutInstructions && (
        <Text>
          <strong>Checkout instructions:</strong>
          <br />
          {checkoutInstructions}
        </Text>
      )}
      {houseRules && (
        <Text>
          <strong>A reminder of the house rules:</strong>
          <br />
          {houseRules}
        </Text>
      )}
      <Text>Safe travels — thanks for being a wonderful guest!</Text>
    </EmailLayout>
  );
}
