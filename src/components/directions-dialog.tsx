'use client';

import { useState } from 'react';
import { Check, Copy, Map, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DirectionsDialogProps {
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Trigger element — rendered via Radix `asChild`. */
  children: React.ReactNode;
}

/**
 * Compact "get directions" modal: open the address in Apple or Google Maps,
 * or copy it to the clipboard.
 */
export function DirectionsDialog({
  address,
  latitude,
  longitude,
  children,
}: DirectionsDialogProps) {
  const [copied, setCopied] = useState(false);

  const destination =
    typeof latitude === 'number' && typeof longitude === 'number'
      ? `${latitude},${longitude}`
      : encodeURIComponent(address);
  const appleUrl = `https://maps.apple.com/?daddr=${destination}`;
  const googleUrl = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;

  function copyAddress() {
    navigator.clipboard.writeText(address);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Get directions</DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/30 py-2 pl-4 pr-2">
          <p className="text-sm leading-relaxed">{address}</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyAddress}
            aria-label="Copy address"
            className="shrink-0"
          >
            {copied ? <Check className="text-green-600" /> : <Copy />}
          </Button>
        </div>

        <div className="grid gap-2">
          <Button asChild variant="outline">
            <a href={appleUrl} target="_blank" rel="noopener noreferrer">
              <MapPin />
              Open in Apple Maps
            </a>
          </Button>
          <Button asChild variant="outline">
            <a href={googleUrl} target="_blank" rel="noopener noreferrer">
              <Map />
              Open in Google Maps
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
