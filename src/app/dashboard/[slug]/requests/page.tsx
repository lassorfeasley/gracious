import { createClient } from '@/lib/supabase/server';
import { BookingRequests } from '@/components/dashboard/booking-requests';

async function getProperty(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('properties').select('id').eq('slug', slug).single();
  return data;
}

export default async function RequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ booking?: string; action?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const property = await getProperty(slug);
  if (!property) return null;

  const supabase = await createClient();
  const { data: bookings } = await supabase
    .from('bookings')
    .select(
      `*, guest:users!guest_user_id(name, email), dates:booking_dates(check_in, check_out), booking_rooms(room:rooms(name))`
    )
    .eq('property_id', property.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Booking requests</h1>
        <p className="text-muted-foreground">Review and respond to stay requests</p>
      </div>
      <BookingRequests bookings={bookings ?? []} />
      {sp.booking && sp.action && (
        <QuickActionHandler bookingId={sp.booking} action={sp.action} />
      )}
    </div>
  );
}

async function QuickActionHandler({
  bookingId,
  action,
}: {
  bookingId: string;
  action: string;
}) {
  if (action !== 'approve' && action !== 'decline') return null;
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const { notifyBookingApproved, notifyBookingDeclined } = await import(
    '@/lib/email/notifications'
  );
  const admin = createAdminClient();
  const status = action === 'approve' ? 'approved' : 'declined';
  await admin.from('bookings').update({ status }).eq('id', bookingId);
  if (action === 'approve') {
    notifyBookingApproved(bookingId).catch(console.error);
  } else {
    notifyBookingDeclined(bookingId).catch(console.error);
  }
  return null;
}
