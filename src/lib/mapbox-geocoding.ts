const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export interface MapboxPlace {
  id: string;
  place_name: string;
  text: string;
  center: [number, number];
}

interface MapboxGeocodeResponse {
  features?: {
    id: string;
    place_name: string;
    text: string;
    center: [number, number];
  }[];
}

export function isMapboxGeocodingEnabled(): boolean {
  return Boolean(TOKEN);
}

export async function searchMapboxPlaces(
  query: string,
  options?: { limit?: number; signal?: AbortSignal }
): Promise<MapboxPlace[]> {
  if (!TOKEN || query.trim().length < 2) return [];

  const limit = options?.limit ?? 5;
  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query.trim())}.json`
  );
  url.searchParams.set('access_token', TOKEN);
  url.searchParams.set('autocomplete', 'true');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('types', 'address,place,locality,neighborhood,postcode,region');

  const res = await fetch(url.toString(), { signal: options?.signal });
  if (!res.ok) return [];

  const data = (await res.json()) as MapboxGeocodeResponse;
  return (data.features ?? []).map((f) => ({
    id: f.id,
    place_name: f.place_name,
    text: f.text,
    center: f.center,
  }));
}

export async function geocodeMapboxPlace(
  query: string,
  options?: { signal?: AbortSignal }
): Promise<MapboxPlace | null> {
  const results = await searchMapboxPlaces(query, { ...options, limit: 1 });
  return results[0] ?? null;
}
