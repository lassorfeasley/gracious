'use client';

import Image from 'next/image';
import { Check, ImageIcon } from 'lucide-react';
import { summarizeBeds } from '@/lib/validations';
import { cn } from '@/lib/utils';

export type RoomCardRoom = {
  name: string;
  image_url: string | null;
  beds: string[];
  max_occupancy: number;
  description?: string | null;
};

type RoomCardProps = {
  room: RoomCardRoom;
  className?: string;
  /** Slightly smaller type for dense layouts like dialogs. */
  compact?: boolean;
  showDescription?: boolean;
};

export function RoomCard({
  room,
  className,
  compact = false,
  showDescription = false,
}: RoomCardProps) {
  const titleClass = compact ? 'text-base' : 'text-lg';
  const metaClass = compact ? 'text-sm' : 'text-base';

  return (
    <div className={cn('block', className)}>
      {room.image_url ? (
        <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl">
          <Image
            src={room.image_url}
            alt={room.name}
            fill
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-4/3 w-full overflow-hidden rounded-2xl bg-linear-to-br from-slate-700 via-slate-800 to-slate-950 transition duration-300 group-hover:from-slate-600 group-hover:via-slate-700 group-hover:to-slate-900" />
      )}
      <p className={cn('mt-4 font-medium', titleClass)}>{room.name}</p>
      <p className={cn('text-muted-foreground', metaClass)}>
        {summarizeBeds(room.beds)} · Up to {room.max_occupancy} guests
      </p>
      {showDescription && room.description && (
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {room.description}
        </p>
      )}
    </div>
  );
}

type SelectableRoomCardProps = {
  room: RoomCardRoom;
  selected: boolean;
  onToggle: () => void;
};

export function SelectableRoomCard({
  room,
  selected,
  onToggle,
}: SelectableRoomCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        'group block w-full rounded-xl text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-xl ring-1 transition',
          selected ? 'ring-2 ring-foreground' : 'ring-border'
        )}
      >
        {room.image_url ? (
          <div className="relative aspect-4/3 w-full">
            <Image
              src={room.image_url}
              alt={room.name}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="flex aspect-4/3 w-full items-center justify-center bg-muted">
            <ImageIcon className="h-7 w-7 text-muted-foreground/40" aria-hidden />
          </div>
        )}
        {selected && (
          <span className="absolute right-2.5 top-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background shadow-sm">
            <Check className="h-3.5 w-3.5" aria-hidden />
          </span>
        )}
      </div>
      <p className="mt-2.5 text-sm font-medium">{room.name}</p>
      <p className="text-sm text-muted-foreground">
        {summarizeBeds(room.beds)} · Up to {room.max_occupancy} guests
      </p>
    </button>
  );
}
