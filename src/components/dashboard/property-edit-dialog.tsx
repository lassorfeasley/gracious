'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertySchema, type PropertyInput } from '@/lib/validations';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { AmenitiesEditor } from '@/components/dashboard/amenities-editor';
import { HOME_AMENITY_PRESETS } from '@/lib/amenities';
import { AddressAutocomplete } from '@/components/dashboard/address-autocomplete';
import { LocationPicker } from '@/components/dashboard/location-picker';
import type { Property } from '@/types/database';

export type PropertyEditField =
  | 'name'
  | 'description'
  | 'image'
  | 'address'
  | 'amenities'
  | 'directions'
  | 'wifi'
  | 'check_in_instructions'
  | 'house_rules';

interface PropertyEditDialogProps {
  property: Property;
  fields: PropertyEditField[];
  title: string;
  trigger: ReactNode;
}

function toFormValues(property: Property): PropertyInput {
  return {
    name: property.name,
    slug: property.slug,
    description: property.description ?? '',
    address: property.address ?? '',
    directions: property.directions ?? '',
    wifi_name: property.wifi_name ?? '',
    wifi_password: property.wifi_password ?? '',
    house_rules: property.house_rules ?? '',
    check_in_instructions: property.check_in_instructions ?? '',
    latitude: property.latitude ?? null,
    longitude: property.longitude ?? null,
    amenities: property.amenities ?? [],
  };
}

export function PropertyEditDialog({
  property,
  fields,
  title,
  trigger,
}: PropertyEditDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const form = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: toFormValues(property),
  });

  const has = (f: PropertyEditField) => fields.includes(f);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) form.reset(toFormValues(property));
  }

  async function uploadHero(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split('.').pop();
    const path = `${property.id}/hero-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(path, file);
    if (uploadError) {
      toast.error(uploadError.message);
      setUploading(false);
      return;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from('property-images').getPublicUrl(path);
    const { error } = await supabase
      .from('properties')
      .update({ hero_image_url: publicUrl })
      .eq('id', property.id);
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Photo updated');
    router.refresh();
  }

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
    toast.success('Saved');
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {has('image') && (
              <div>
                <Label>Photo</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={uploadHero}
                  disabled={uploading}
                  className="mt-1"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  {uploading
                    ? 'Uploading…'
                    : property.hero_image_url
                      ? 'A photo is set. Choose a file to replace it.'
                      : 'Upload a photo for your place.'}
                </p>
              </div>
            )}

            {has('name') && (
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
            )}

            {has('description') && (
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={5} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {has('address') && (
              <>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <AddressAutocomplete
                          {...field}
                          value={field.value ?? ''}
                          onPlaceSelect={(place) => {
                            form.setValue('latitude', place.latitude, {
                              shouldDirty: true,
                            });
                            form.setValue('longitude', place.longitude, {
                              shouldDirty: true,
                            });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="space-y-1">
                  <Label>Location pin</Label>
                  <p className="text-sm text-muted-foreground">
                    Set the exact spot shown on the map. Use “Locate from
                    address” or drag the pin.
                  </p>
                  <LocationPicker
                    address={form.watch('address')}
                    latitude={form.watch('latitude')}
                    longitude={form.watch('longitude')}
                    onChange={(lat, lng) => {
                      form.setValue('latitude', lat, { shouldDirty: true });
                      form.setValue('longitude', lng, { shouldDirty: true });
                    }}
                    className="pt-1"
                  />
                </div>
              </>
            )}

            {has('check_in_instructions') && (
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
            )}

            {has('directions') && (
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
            )}

            {has('wifi') && (
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
            )}

            {has('house_rules') && (
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
            )}

            {has('amenities') && (
              <FormField
                control={form.control}
                name="amenities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amenities</FormLabel>
                    <AmenitiesEditor
                      value={field.value}
                      onChange={field.onChange}
                      presets={HOME_AMENITY_PRESETS}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save changes'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
