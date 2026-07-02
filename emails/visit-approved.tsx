import { Button, Text } from '@react-email/components';
import { EmailLayout, buttonStyle } from './components/layout';
import { EmailHero } from './components/hero';
import { EmailCalendarLinks } from './components/calendar-links';
import { EmailSection, FactsCard, QuoteCard, VisitDatesCard } from './components/cards';
import { HostInviteFooter } from './components/footer';

interface Props {
  guestName: string;
  /** The host who approved; omit to fall back to neutral copy. */
  hostName?: string;
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
  /** Featured property photo, shown as a banner below the copy. */
  heroImageUrl?: string;
  /** Pre-filled add-to-calendar links. */
  googleCalendarUrl?: string;
  outlookCalendarUrl?: string;
  /** True when the recipient already hosts; hides the "become a host" aside. */
  recipientIsHost?: boolean;
  /** Authenticated deep link for the "become a host" aside. */
  hostOnboardingUrl?: string;
}

export default function VisitApprovedEmail(props: Props) {
  const hostFirstName = props.hostName?.trim().split(/\s+/)[0];

  const preview = hostFirstName
    ? `${hostFirstName} confirmed your visit to ${props.propertyName}`
    : `Your visit to ${props.propertyName} is confirmed`;

  const heading = hostFirstName ? (
    <>
      <span style={nameStyle}>{hostFirstName}</span> confirmed your visit to{' '}
      <span style={nameStyle}>{props.propertyName}</span>
    </>
  ) : (
    <>
      Your visit to <span style={nameStyle}>{props.propertyName}</span> is
      confirmed
    </>
  );

  return (
    <EmailLayout
      preview={preview}
      heading={heading}
      logoPlacement="footer"
      footerAside={
        <HostInviteFooter
          recipientIsHost={props.recipientIsHost ?? false}
          href={props.hostOnboardingUrl}
        />
      }
    >
      <Text>
        Hi {props.guestName} — you&apos;re all set. Everything you need for
        your visit is below.
      </Text>

      {props.hostNote && (
        <QuoteCard attribution={props.hostName}>{props.hostNote}</QuoteCard>
      )}

      <EmailHero
        propertyName={props.propertyName}
        imageUrl={props.heroImageUrl}
      />

      <VisitDatesCard
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
          A calendar file (.ics) is attached to add this visit to your calendar.
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

const nameStyle = { color: '#a2773e' };
