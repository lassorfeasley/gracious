'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertySchema, type PropertyInput } from '@/lib/validations';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import type { Property } from '@/types/database';

export function PropertyProfileForm({ property }: { property: Property }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const form = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: {
      name: property.name,
      slug: property.slug,
      description: property.description ?? '',
      address: property.address ?? '',
      directions: property.directions ?? '',
      wifi_name: property.wifi_name ?? '',
      wifi_password: property.wifi_password ?? '',
      house_rules: property.house_rules ?? '',
      check_in_instructions: property.check_in_instructions ?? '',
    },
  });

  async function onSubmit(values: PropertyInput) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('properties')
      .update(values)
      .eq('id', property.id);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Property updated');
    router.refresh();
  }

  async function uploadHero(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const path = `${property.id}/hero-${Date.now()}.${file.name.split('.').pop()}`;
    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(path, file);
    if (uploadError) {
      toast.error(uploadError.message);
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(path);
    await supabase
      .from('properties')
      .update({ hero_image_url: publicUrl })
      .eq('id', property.id);
    setUploading(false);
    toast.success('Hero image uploaded');
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-6">
        <div>
          <FormLabel>Hero image</FormLabel>
          <Input type="file" accept="image/*" onChange={uploadHero} disabled={uploading} className="mt-1" />
          {property.hero_image_url && (
            <p className="mt-1 text-xs text-muted-foreground">Current image set</p>
          )}
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="directions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Directions</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="wifi_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WiFi network</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="wifi_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WiFi password</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="check_in_instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Check-in instructions</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="house_rules"
          render={({ field }) => (
            <FormItem>
              <FormLabel>House rules</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save changes'}
        </Button>
      </form>
    </Form>
  );
}
