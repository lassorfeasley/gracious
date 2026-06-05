'use client';

import { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Map as MapboxMap, Marker as MapboxMarker } from 'mapbox-gl';
import { LocateFixed, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { geocodeMapboxPlace } from '@/lib/mapbox-geocoding';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const DEFAULT_CENTER: [number, number] = [-98.5795, 39.8283];

interface LocationPickerProps {
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  onChange: (lat: number, lng: number) => void;
  className?: string;
}

export function LocationPicker({
  address,
  latitude,
  longitude,
  onChange,
  className,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const markerRef = useRef<MapboxMarker | null>(null);
  const onChangeRef = useRef(onChange);
  const addressRef = useRef(address);

  useEffect(() => {
    onChangeRef.current = onChange;
    addressRef.current = address;
  });

  const initialCoords = useRef<[number, number] | null>(
    typeof longitude === 'number' && typeof latitude === 'number'
      ? [longitude, latitude]
      : null
  );

  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import('mapbox-gl')).default;
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = TOKEN as string;

      const start = initialCoords.current ?? DEFAULT_CENTER;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: start,
        zoom: initialCoords.current ? 14 : 3,
      });
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      const marker = new mapboxgl.Marker({ draggable: true, color: '#111111' })
        .setLngLat(start)
        .addTo(map);

      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat();
        onChangeRef.current(lat, lng);
      });
      map.on('click', (e) => {
        marker.setLngLat(e.lngLat);
        onChangeRef.current(e.lngLat.lat, e.lngLat.lng);
      });

      mapRef.current = map;
      markerRef.current = marker;
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (
      typeof longitude !== 'number' ||
      typeof latitude !== 'number' ||
      !mapRef.current ||
      !markerRef.current
    ) {
      return;
    }
    markerRef.current.setLngLat([longitude, latitude]);
    mapRef.current.flyTo({ center: [longitude, latitude], zoom: 14 });
  }, [latitude, longitude]);

  async function locateFromAddress() {
    if (!TOKEN || !addressRef.current) return;
    setLocating(true);
    try {
      const place = await geocodeMapboxPlace(addressRef.current);
      if (place && mapRef.current && markerRef.current) {
        const [lng, lat] = place.center;
        markerRef.current.setLngLat([lng, lat]);
        mapRef.current.flyTo({ center: [lng, lat], zoom: 14 });
        onChangeRef.current(lat, lng);
      }
    } catch {
      // ignore geocode failures
    } finally {
      setLocating(false);
    }
  }

  if (!TOKEN) {
    return (
      <div
        className={cn(
          'flex h-48 items-center justify-center rounded-lg border bg-muted/30 text-center text-sm text-muted-foreground',
          className
        )}
      >
        <div className="px-6">
          <MapPin className="mx-auto mb-2 h-5 w-5" />
          Add a{' '}
          <code className="rounded bg-muted px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code>{' '}
          to set the location.
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      <div className="relative h-64 overflow-hidden rounded-lg border">
        <div ref={containerRef} className="h-full w-full" />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={locateFromAddress}
          disabled={locating || !address}
        >
          <LocateFixed className="mr-1 h-4 w-4" />
          {locating ? 'Locating…' : 'Locate from address'}
        </Button>
        <p className="text-xs text-muted-foreground">
          {typeof latitude === 'number' && typeof longitude === 'number'
            ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : 'Drag the pin or click the map to set the exact spot'}
        </p>
      </div>
    </div>
  );
}
