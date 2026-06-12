import type { Property, Room } from '@/types/database';

function pickFeatured(
  images: { url: string; is_featured: boolean; display_order: number }[]
): string | null {
  if (images.length === 0) return null;
  const sorted = [...images].sort((a, b) => a.display_order - b.display_order);
  return (sorted.find((i) => i.is_featured) ?? sorted[0]).url;
}

/** Best photo to represent a property: hero, then featured/first gallery image. */
export function propertyOgImage(property: Property): string | null {
  return (
    property.hero_image_url ?? pickFeatured(property.property_images ?? [])
  );
}

/** Best photo to represent a room, falling back to the house photo. */
export function roomOgImage(room: Room, property?: Property): string | null {
  return (
    room.image_url ??
    pickFeatured(room.room_images ?? []) ??
    (property ? propertyOgImage(property) : null)
  );
}
