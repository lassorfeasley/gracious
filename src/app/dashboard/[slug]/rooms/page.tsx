import { createClient } from '@/lib/supabase/server';
import { RoomsManager } from '@/components/dashboard/rooms-manager';
import { AvailabilityBlocks } from '@/components/dashboard/availability-blocks';

async function getProperty(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('properties').select('*').eq('slug', slug).single();
  return data;
}

export default async function RoomsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const property = await getProperty(slug);
  if (!property) return null;

  const supabase = await createClient();
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('property_id', property.id)
    .order('display_order');

  const roomIds = rooms?.map((r) => r.id) ?? [];
  const { data: blocks } = roomIds.length
    ? await supabase
        .from('room_availability')
        .select('*, room:rooms(name)')
        .in('room_id', roomIds)
        .eq('is_blocked', true)
    : { data: [] };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Rooms</h1>
        <p className="text-muted-foreground">Manage rooms and availability</p>
      </div>
      <RoomsManager propertyId={property.id} rooms={rooms ?? []} />
      {(rooms?.length ?? 0) > 0 && (
        <AvailabilityBlocks rooms={rooms ?? []} blocks={blocks ?? []} />
      )}
    </div>
  );
}
