import type { Property } from '@/types/database';

/** Normalize Supabase join results (object or single-element array). */
export function normalizeProperty(value: unknown): Property | null {
  if (!value) return null;
  if (Array.isArray(value)) {
    return (value[0] as Property | undefined) ?? null;
  }
  return value as Property;
}

export function isValidProperty(p: Property | null): p is Property {
  return !!p?.id && !!p?.slug && !!p?.name;
}
