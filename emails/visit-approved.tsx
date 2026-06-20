import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';
import { EmailHero } from './components/hero';
import { EmailCalendarLinks } from './components/calendar-links';
import { EmailSection, FactsCard, StayDatesCard } from './components/cards';
import { HostInviteFooter } from './components/footer';

interface Props {
  guestName: string;
  propertyName: string;
  /** yyyy-MM-dd */
  checkInDate: string;
  /** yyyy-MM-dd */
  checkOutDate: string;
  rooms: string;
  partySize?: number;
  address?: string;
  directions?: string;
  wifiName?: string;
  wifiPassword?: string;
  /** Check-in instructions (prose). */
  checkIn?: string;
  houseRules?: string;
  coguestNote?: string;
  /** Optional personal note from the host. */
  hostNote?: string;
  profileUrl?: string;
  /** Featured property photo, shown as a banner above the heading. */
  heroImageUrl?: string;
  /** Pre-filled add-to-calendar links. */
  googleCalendarUrl?: string;
  outlookCalendarUrl?: string;
  /** True when the recipient already hosts; hides the "become a host" aside. */
  recipientIsHost?: boolean;
  /** Authenticated deep link for the "become a host" aside. */
  hostOnboardingUrl?: string;
}

export default function BookingApprovedEmail(props: Props) {
  return (
    <EmailLayout
      preview={`Your stay at ${props.propertyName} is confirmed`}
      heading="Your stay is confirmed!"
      hero={
        <EmailHero
          propertyName={props.propertyName}
          imageUrl={props.heroImageUrl}
        />
      }
      footerAside={
        <HostInviteFooter
          recipientIsHost={props.recipientIsHost ?? false}
          href={props.hostOnboardingUrl}
        />
      }
    >
      <Text>Hi {props.guestName},</Text>
      <Text>
        Your stay at <strong>{props.propertyName}</strong> has been approved.
      </Text>

      {props.hostNote && (
        <EmailSection title="A note from your host">
          <Text style={{ margin: '0', whiteSpace: 'pre-wrap' }}>
            {props.hostNote}
          </Text>
        </EmailSection>
      )}

      <StayDatesCard
        checkInDate={props.checkInDate}
        checkOutDate={props.checkOutDate}
      />

      <FactsCard
        facts={[
          { label: 'Rooms', value: props.rooms },
          {
            label: 'Guests',
            value: props.partySize
              ? `${props.partySize} ${props.partySize === 1 ? 'guest' : 'guests'}`
              : undefined,
          },
          { label: 'Address', value: props.address },
          {
            label: 'WiFi',
            value: props.wifiName
              ? `${props.wifiName}${props.wifiPassword ? ` · Password: ${props.wifiPassword}` : ''}`
              : undefined,
          },
        ]}
      />

      {props.coguestNote && <Text>{props.coguestNote}</Text>}

      {props.checkIn && (
        <EmailSection title="Getting in">
          <Text style={{ margin: '0' }}>{props.checkIn}</Text>
        </EmailSection>
      )}
      {props.directions && (
        <EmailSection title="Directions">
          <Text style={{ margin: '0' }}>{props.directions}</Text>
        </EmailSection>
      )}
      {props.houseRules && (
        <EmailSection title="House rules">
          <Text style={{ margin: '0' }}>{props.houseRules}</Text>
        </EmailSection>
      )}

      {props.googleCalendarUrl && props.outlookCalendarUrl ? (
        <EmailCalendarLinks
          googleUrl={props.googleCalendarUrl}
          outlookUrl={props.outlookCalendarUrl}
          icsAttached
        />
      ) : (
        <Text>
          A calendar file (.ics) is attached to add this stay to your calendar.
        </Text>
      )}
      {props.profileUrl && (
        <Button style={buttonStyle} href={props.profileUrl}>
          View house details
        </Button>
      )}
    </EmailLayout>
  );
}
