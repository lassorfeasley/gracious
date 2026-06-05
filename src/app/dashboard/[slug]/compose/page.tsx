import { Suspense } from 'react';
import { getDashboardProperty } from '@/lib/dashboard-property';
import { getInvitationRoomAvailability } from '@/lib/guest-availability';
import { createClient } from '@/lib/supabase/server';
import { StayCompose } from '@/components/dashboard/stay-compose';

export default async function ComposePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getDashboardProperty(slug);

  const supabase = await createClient();
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('property_id', property.id)
    .order('display_order');

  const roomIds = (rooms ?? []).map((r) => r.id);
  const roomAvailability = await getInvitationRoomAvailability(roomIds);

  return (
    <Suspense fallback={<div className="text-muted-foreground">Loading…</div>}>
      <StayCompose
        propertyId={property.id}
        slug={slug}
        rooms={rooms ?? []}
        roomAvailability={roomAvailability}
      />
    </Suspense>
  );
}
