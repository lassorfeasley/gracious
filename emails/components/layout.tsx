import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  preview: string;
  heading: string;
  children: React.ReactNode;
  /** When provided, an unsubscribe link is shown in the footer (opt-out emails). */
  unsubscribeUrl?: string;
}

export function EmailLayout({
  preview,
  heading,
  children,
  unsubscribeUrl,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={logo}>GuestHouse</Text>
          <Heading style={h1}>{heading}</Heading>
          <Section style={content}>{children}</Section>
          <Hr style={hr} />
          <Text style={footer}>
            GuestHouse — private stays with people you trust.
            {unsubscribeUrl && (
              <>
                <br />
                <Link href={unsubscribeUrl} style={footerLink}>
                  Unsubscribe from these emails
                </Link>
              </>
            )}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f6f6',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '40px auto',
  padding: '32px',
  borderRadius: '8px',
  maxWidth: '560px',
};

const logo = {
  fontSize: '14px',
  fontWeight: '600' as const,
  color: '#111',
  letterSpacing: '0.05em',
  textTransform: 'uppercase' as const,
  margin: '0 0 24px',
};

const h1 = {
  fontSize: '24px',
  fontWeight: '600' as const,
  color: '#111',
  margin: '0 0 16px',
};

const content = {
  color: '#444',
  fontSize: '16px',
  lineHeight: '24px',
};

const hr = { borderColor: '#eee', margin: '24px 0' };

const footer = {
  color: '#999',
  fontSize: '12px',
  margin: 0,
  lineHeight: '20px',
};

const footerLink = {
  color: '#999',
  fontSize: '12px',
  textDecoration: 'underline',
};

export const buttonStyle = {
  backgroundColor: '#111',
  color: '#fff',
  padding: '12px 24px',
  borderRadius: '6px',
  textDecoration: 'none',
  display: 'inline-block',
  fontWeight: '600' as const,
  fontSize: '14px',
};
