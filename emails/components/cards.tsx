import { Column, Hr, Row, Section, Text } from '@react-email/components';
import { format, parseISO } from 'date-fns';
import * as React from 'react';

/*
 * Structured building blocks for emails (Airbnb-style cards). Icons are
 * unicode glyphs, not SVG — Gmail and Outlook strip <svg>, so typographic
 * arrows plus card structure are the email-safe way to add visual hierarchy.
 */

/* Brand palette — paper, ink, pine, brass (see components/layout.tsx). */
const BORDER = '1px solid #e4ddd0';

interface StayDatesCardProps {
  /** yyyy-MM-dd */
  checkInDate: string;
  /** yyyy-MM-dd */
  checkOutDate: string;
  checkInTime?: string;
  checkOutTime?: string;
}

/**
 * Two-column check-in / checkout card, the visual anchor of every email
 * about a stay.
 */
export function StayDatesCard({
  checkInDate,
  checkOutDate,
  checkInTime = '3:00 PM',
  checkOutTime = '11:00 AM',
}: StayDatesCardProps) {
  const checkIn = parseISO(checkInDate);
  const checkOut = parseISO(checkOutDate);

  return (
    <Section style={card}>
      <Row>
        <Column style={{ ...dateCol, borderRight: BORDER }}>
          <Text style={dateLabel}>↓&nbsp;&nbsp;Check-in</Text>
          <Text style={dateDay}>{format(checkIn, 'EEEE')}</Text>
          <Text style={dateFull}>{format(checkIn, 'MMMM d, yyyy')}</Text>
          <Text style={dateTime}>{checkInTime}</Text>
        </Column>
        <Column style={dateCol}>
          <Text style={dateLabel}>↑&nbsp;&nbsp;Checkout</Text>
          <Text style={dateDay}>{format(checkOut, 'EEEE')}</Text>
          <Text style={dateFull}>{format(checkOut, 'MMMM d, yyyy')}</Text>
          <Text style={dateTime}>{checkOutTime}</Text>
        </Column>
      </Row>
    </Section>
  );
}

export interface Fact {
  label: string;
  /** Row is omitted when empty/undefined. */
  value?: string | null;
}

/** Bordered card of labeled rows — rooms, guests, WiFi, address, etc. */
export function FactsCard({ facts }: { facts: Fact[] }) {
  const rows = facts.filter((f): f is Fact & { value: string } => !!f.value);
  if (rows.length === 0) return null;

  return (
    <Section style={card}>
      {rows.map((f, i) => (
        <div
          key={f.label}
          style={{
            padding: '12px 20px',
            borderTop: i > 0 ? BORDER : undefined,
          }}
        >
          <Text style={factLabel}>{f.label}</Text>
          <Text style={factValue}>{f.value}</Text>
        </div>
      ))}
    </Section>
  );
}

/** Personal message / guest note, set apart on a paper-tint background. */
export function QuoteCard({
  children,
  attribution,
}: {
  children: React.ReactNode;
  attribution?: string;
}) {
  return (
    <Section style={quote}>
      <Text style={quoteText}>&ldquo;{children}&rdquo;</Text>
      {attribution && <Text style={quoteAttribution}>— {attribution}</Text>}
    </Section>
  );
}

/** Rule-separated prose section with a small bold heading. */
export function EmailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Hr style={sectionHr} />
      <Text style={sectionTitle}>{title}</Text>
      {children}
    </>
  );
}

const card = {
  border: BORDER,
  borderRadius: '12px',
  margin: '20px 0',
  // border-collapse breaks rounded corners on the table react-email renders.
  borderCollapse: 'separate' as const,
  width: '100%',
};

const dateCol = {
  width: '50%',
  padding: '16px 20px',
  verticalAlign: 'top' as const,
};

const dateLabel = {
  fontSize: '12px',
  fontWeight: '600' as const,
  color: '#8a8273',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
  margin: '0 0 8px',
};

const dateDay = {
  fontSize: '18px',
  fontWeight: '600' as const,
  color: '#221e19',
  margin: '0',
  lineHeight: '26px',
};

const dateFull = {
  fontSize: '14px',
  color: '#48433c',
  margin: '0',
  lineHeight: '22px',
};

const dateTime = {
  fontSize: '14px',
  color: '#8a8273',
  margin: '0',
  lineHeight: '22px',
};

const factLabel = {
  fontSize: '11px',
  fontWeight: '600' as const,
  color: '#8a8273',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.04em',
  margin: '0 0 2px',
};

const factValue = {
  fontSize: '15px',
  color: '#221e19',
  margin: '0',
  lineHeight: '22px',
};

const quote = {
  backgroundColor: '#f7f4ed',
  borderRadius: '12px',
  padding: '16px 20px',
  margin: '20px 0',
};

const quoteText = {
  fontSize: '15px',
  fontStyle: 'italic' as const,
  color: '#48433c',
  margin: '0',
  lineHeight: '24px',
};

const quoteAttribution = {
  fontSize: '13px',
  color: '#8a8273',
  margin: '8px 0 0',
};

const sectionHr = {
  borderColor: '#e4ddd0',
  margin: '24px 0 16px',
};

const sectionTitle = {
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#221e19',
  margin: '0 0 4px',
};
