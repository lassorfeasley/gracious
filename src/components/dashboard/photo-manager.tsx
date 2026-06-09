'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Star, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface PhotoRecord {
  id: string;
  url: string;
  is_featured: boolean;
  created_at?: string;
}

interface PhotoManagerProps {
  images: PhotoRecord[];
  table: 'property_images' | 'room_images';
  parentColumn: 'property_id' | 'room_id';
  parentId: string;
  storagePrefix: string;
  featuredTable: 'properties' | 'rooms';
  featuredColumn: 'hero_image_url' | 'image_url';
  featuredId: string;
}

function storagePathFromUrl(url: string): string | null {
  const marker = '/property-images/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}

function sortPhotos(images: PhotoRecord[]): PhotoRecord[] {
  return [...images].sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    if (a.created_at && b.created_at) {
      return a.created_at.localeCompare(b.created_at);
    }
    return 0;
  });
}

export function PhotoManager({
  images: initialImages,
  table,
  parentColumn,
  parentId,
  storagePrefix,
  featuredTable,
  featuredColumn,
  featuredId,
}: PhotoManagerProps) {
  const router = useRouter();
  const [images, setImages] = useState(() => sortPhotos(initialImages));
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setImages(sortPhotos(initialImages));
  }, [initialImages]);

  async function syncFeaturedUrl(url: string | null) {
    const supabase = createClient();
    const { error } = await supabase
      .from(featuredTable)
      .update({ [featuredColumn]: url })
      .eq('id', featuredId);
    if (error) throw error;
  }

  async function clearFeaturedFlags() {
    const supabase = createClient();
    const { error } = await supabase
      .from(table)
      .update({ is_featured: false })
      .eq(parentColumn, parentId);
    if (error) throw error;
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setUploading(true);
    const supabase = createClient();
    let featuredAssigned = images.some((img) => img.is_featured);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop() ?? 'jpg';
        const path = `${storagePrefix}${Date.now()}-${i}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(path, file);
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from('property-images').getPublicUrl(path);

        const shouldFeature = !featuredAssigned;

        const { error: insertError } = await supabase.from(table).insert({
          [parentColumn]: parentId,
          url: publicUrl,
          is_featured: shouldFeature,
        });
        if (insertError) throw insertError;

        if (shouldFeature) {
          await syncFeaturedUrl(publicUrl);
          featuredAssigned = true;
        }
      }

      toast.success(
        files.length === 1 ? 'Photo uploaded' : `${files.length} photos uploaded`
      );
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleSetFeatured(photo: PhotoRecord) {
    if (photo.is_featured) return;

    setBusyId(photo.id);
    try {
      await clearFeaturedFlags();
      const supabase = createClient();
      const { error } = await supabase
        .from(table)
        .update({ is_featured: true })
        .eq('id', photo.id);
      if (error) throw error;
      await syncFeaturedUrl(photo.url);
      toast.success('Featured photo updated');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to set featured');
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(photo: PhotoRecord) {
    setBusyId(photo.id);
    try {
      const supabase = createClient();
      const storagePath = storagePathFromUrl(photo.url);
      if (storagePath) {
        await supabase.storage.from('property-images').remove([storagePath]);
      }

      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('id', photo.id);
      if (deleteError) throw deleteError;

      if (photo.is_featured) {
        const remaining = sortPhotos(images.filter((img) => img.id !== photo.id));
        if (remaining.length > 0) {
          const next = remaining[0];
          await clearFeaturedFlags();
          const { error } = await supabase
            .from(table)
            .update({ is_featured: true })
            .eq('id', next.id);
          if (error) throw error;
          await syncFeaturedUrl(next.url);
        } else {
          await syncFeaturedUrl(null);
        }
      }

      toast.success('Photo deleted');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label>Photos</Label>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="mt-1"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          {uploading
            ? 'Uploading…'
            : images.length > 0
              ? 'Upload more photos or set a featured image below.'
              : 'Upload photos. The first photo becomes the featured image.'}
        </p>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((photo) => (
            <div
              key={photo.id}
              className="group relative aspect-4/3 overflow-hidden rounded-lg border bg-muted"
            >
              <Image
                src={photo.url}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 200px"
              />
              {photo.is_featured && (
                <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                  Featured
                </span>
              )}
              <div className="absolute inset-0 flex items-end justify-center gap-1 bg-linear-to-t from-black/60 via-transparent to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  disabled={busyId === photo.id || photo.is_featured}
                  onClick={() => handleSetFeatured(photo)}
                  aria-label="Set as featured"
                >
                  <Star
                    className={cn(
                      'h-4 w-4',
                      photo.is_featured && 'fill-current text-amber-400'
                    )}
                  />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  disabled={busyId === photo.id}
                  onClick={() => handleDelete(photo)}
                  aria-label="Delete photo"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
