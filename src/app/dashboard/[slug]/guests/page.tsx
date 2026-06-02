import { createClient } from '@/lib/supabase/server';
import { InvitationsManager } from '@/components/dashboard/invitations-manager';

async function getProperty(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('properties').select('*').eq('slug', slug).single();
  return data;
}

export default async function GuestsPage({
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

  const { data: invitations } = await supabase
    .from('invitations')
    .select('*')
    .eq('property_id', property.id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Guests</h1>
        <p className="text-muted-foreground">Manage invitations</p>
      </div>
      <InvitationsManager
        propertyId={property.id}
        rooms={rooms ?? []}
        invitations={invitations ?? []}
      />
    </div>
  );
}
