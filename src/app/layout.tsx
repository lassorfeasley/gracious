import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Inter, Fraunces } from 'next/font/google';
import { Toaster } from '@/components/ui/sonner';
import { DevToolbar } from '@/components/dev/dev-toolbar';
import { appUrl } from '@/lib/env';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const display = Fraunces({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-display-family',
});

const description = 'A warm, private way to have friends and family to stay.';

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: {
    default: 'Gracious',
    template: '%s · Gracious',
  },
  description,
  robots: { index: false, follow: false },
  openGraph: {
    siteName: 'Gracious',
    type: 'website',
    title: 'Gracious',
    description,
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans antialiased">
        <Suspense fallback={null}>
          <DevToolbar />
        </Suspense>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
