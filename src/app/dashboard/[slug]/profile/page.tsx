import { createClient } from '@/lib/supabase/server';
import { PropertyProfileForm } from '@/components/dashboard/property-profile-form';

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: property } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', slug)
    .single();

  if (!property) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">House profile</h1>
        <p className="text-muted-foreground">
          Details guests see on their invitation page
        </p>
      </div>
      <PropertyProfileForm property={property} />
    </div>
  );
}
