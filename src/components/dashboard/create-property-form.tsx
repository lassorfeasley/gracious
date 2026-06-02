'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { propertySchema, type PropertyInput } from '@/lib/validations';
import { slugify } from '@/lib/slug';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

export function CreatePropertyForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<PropertyInput>({
    resolver: zodResolver(propertySchema),
    defaultValues: { name: '', slug: '' },
  });

  const name = form.watch('name');
  if (name && !form.getValues('slug')) {
    form.setValue('slug', slugify(name));
  }

  async function onSubmit(values: PropertyInput) {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from('properties')
      .insert({
        ...values,
        owner_id: userId,
      })
      .select()
      .single();
    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Property created!');
    router.push(`/dashboard/${data.slug}/overview`);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Property name</FormLabel>
              <FormControl>
                <Input placeholder="Lake House" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL slug</FormLabel>
              <FormControl>
                <Input placeholder="lake-house" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create property'}
        </Button>
      </form>
    </Form>
  );
}
