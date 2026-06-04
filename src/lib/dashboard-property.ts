import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth';
import type { Property } from '@/types/database';

export async function getDashboardProperty(slug: string): Promise<Property> {
  const user = await getCurrentUser();
  if (!user) notFound();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) notFound();

  if (data.owner_id !== user.id) {
    const { data: manager } = await supabase
      .from('property_managers')
      .select('id')
      .eq('property_id', data.id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!manager) notFound();
  }

  return data as Property;
}
