'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface GalleryPhoto {
  id: string;
  url: string;
  is_featured?: boolean;
  created_at?: string;
}

interface PhotoGalleryProps {
  photos: GalleryPhoto[];
  title?: string;
  className?: string;
}

function sortPhotos(photos: GalleryPhoto[]): GalleryPhoto[] {
  return [...photos].sort((a, b) => {
    if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
    if (a.created_at && b.created_at) {
      return a.created_at.localeCompare(b.created_at);
    }
    return 0;
  });
}

export function PhotoGallery({ photos, title, className }: PhotoGalleryProps) {
  const sorted = sortPhotos(photos);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  if (sorted.length === 0) return null;

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goPrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex === 0 ? sorted.length - 1 : lightboxIndex - 1
    );
  };

  const goNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      lightboxIndex === sorted.length - 1 ? 0 : lightboxIndex + 1
    );
  };

  return (
    <>
      <section className={cn('py-10', className)}>
        {title && (
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        )}
        <div
          className={cn(
            'grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3',
            title && 'mt-6'
          )}
        >
          {sorted.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              onClick={() => openLightbox(index)}
              className={cn(
                'relative aspect-4/3 overflow-hidden rounded-xl bg-muted',
                index === 0 && sorted.length >= 3 && 'col-span-2 row-span-2 aspect-auto min-h-48 sm:min-h-64'
              )}
            >
              <Image
                src={photo.url}
                alt=""
                fill
                className="object-cover transition duration-300 hover:scale-105"
                sizes="(max-width: 640px) 50vw, 33vw"
              />
            </button>
          ))}
        </div>
      </section>

      <Dialog
        open={lightboxIndex !== null}
        onOpenChange={(open) => !open && closeLightbox()}
      >
        <DialogContent className="max-w-4xl border-none bg-black/95 p-0 text-white">
          <DialogTitle className="sr-only">Photo gallery</DialogTitle>
          {lightboxIndex !== null && (
            <div className="relative flex min-h-[60vh] items-center justify-center">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 z-10 text-white hover:bg-white/20"
                onClick={closeLightbox}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>

              {sorted.length > 1 && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute left-2 z-10 text-white hover:bg-white/20"
                    onClick={goPrev}
                    aria-label="Previous photo"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 z-10 -translate-y-1/2 text-white hover:bg-white/20"
                    onClick={goNext}
                    aria-label="Next photo"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}

              <div className="relative h-[60vh] w-full">
                <Image
                  src={sorted[lightboxIndex].url}
                  alt=""
                  fill
                  className="object-contain"
                  sizes="100vw"
                  priority
                />
              </div>

              {sorted.length > 1 && (
                <p className="absolute bottom-3 left-1/2 -translate-x-1/2 text-sm text-white/70">
                  {lightboxIndex + 1} / {sorted.length}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
