import type { Metadata } from 'next';

// The signup page is a client component, so its title lives here.
export const metadata: Metadata = { title: 'Sign up' };

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
