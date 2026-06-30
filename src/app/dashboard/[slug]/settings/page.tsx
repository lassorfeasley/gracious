import { redirect } from 'next/navigation';

export const metadata = { title: 'Settings' };

// Settings are account-level now, not per-home. Home-specific config (name,
// managers) lives on the home's overview page; everything else moved here.
export default async function LegacyHomeSettingsPage() {
  redirect('/dashboard/settings');
}
