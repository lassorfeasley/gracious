'use client';

import { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Map as MapboxMap } from 'mapbox-gl';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface PropertyMapProps {
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

export function PropertyMap({
  address,
  latitude,
  longitude,
  className,
}: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapboxMap | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    let cancelled = false;

    async function resolveCoords(): Promise<[number, number] | null> {
      if (typeof longitude === 'number' && typeof latitude === 'number') {
        return [longitude, latitude];
      }
      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            address
          )}.json?limit=1&access_token=${TOKEN}`
        );
        const data = await res.json();
        const center = data?.features?.[0]?.center;
        if (Array.isArray(center) && center.length === 2) {
          return [center[0] as number, center[1] as number];
        }
      } catch {
        // fall through to error state
      }
      return null;
    }

    async function init() {
      const coords = await resolveCoords();
      if (cancelled || !containerRef.current) return;
      if (!coords) {
        setStatus('error');
        return;
      }
      const mapboxgl = (await import('mapbox-gl')).default;
      if (cancelled || !containerRef.current) return;
      mapboxgl.accessToken = TOKEN as string;
      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: coords,
        zoom: 13,
      });
      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      new mapboxgl.Marker({ color: '#111111' }).setLngLat(coords).addTo(map);
      mapRef.current = map;
      map.on('load', () => {
        if (!cancelled) setStatus('ready');
      });
    }

    init();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [address, latitude, longitude]);

  if (!TOKEN) {
    return (
      <div
        className={cn(
          'flex h-64 items-center justify-center rounded-xl border bg-muted/30 text-center text-sm text-muted-foreground',
          className
        )}
      >
        <div className="px-6">
          <MapPin className="mx-auto mb-2 h-5 w-5" />
          <p>
            Add a{' '}
            <code className="rounded bg-muted px-1">NEXT_PUBLIC_MAPBOX_TOKEN</code>{' '}
            to show the map.
          </p>
          {address && <p className="mt-1">{address}</p>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('relative h-64 overflow-hidden rounded-xl border', className)}
    >
      <div ref={containerRef} className="h-full w-full" />
      {status === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/30 text-center text-sm text-muted-foreground">
          <div className="px-6">
            <MapPin className="mx-auto mb-2 h-5 w-5" />
            <p>Couldn&apos;t locate this address on the map.</p>
            <p className="mt-1">{address}</p>
          </div>
        </div>
      )}
    </div>
  );
}
