import { Text } from '@react-email/components';
import { EmailLayout } from './components/layout';
import { EmailSection, FactsCard } from './components/cards';

interface Props {
  guestName: string;
  propertyName: string;
  checkoutTime?: string;
  checkoutInstructions?: string;
  houseRules?: string;
  unsubscribeUrl?: string;
}

export default function CheckoutInstructionsEmail({
  guestName,
  propertyName,
  checkoutTime,
  checkoutInstructions,
  houseRules,
  unsubscribeUrl,
}: Props) {
  return (
    <EmailLayout
      preview={`Checkout details for your visit at ${propertyName}`}
      heading="Time to head out"
      unsubscribeUrl={unsubscribeUrl}
    >
      <Text>Hi {guestName},</Text>
      <Text>
        We hope you enjoyed your visit at <strong>{propertyName}</strong>. Here
        are a few things to take care of before you go.
      </Text>

      <FactsCard
        facts={[{ label: '↑ Checkout time', value: checkoutTime }]}
      />

      {checkoutInstructions && (
        <EmailSection title="Before you go">
          <Text style={{ margin: '0' }}>{checkoutInstructions}</Text>
        </EmailSection>
      )}
      {houseRules && (
        <EmailSection title="A reminder of the house rules">
          <Text style={{ margin: '0' }}>{houseRules}</Text>
        </EmailSection>
      )}

      <Text>Safe travels — thanks for being a wonderful guest!</Text>
    </EmailLayout>
  );
}
