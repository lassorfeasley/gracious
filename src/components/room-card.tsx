'use client';

import Image from 'next/image';
import { Check } from 'lucide-react';
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
        <>
          <div className="relative aspect-4/3 w-full overflow-hidden rounded-2xl">
            <Image
              src={room.image_url}
              alt={room.name}
              fill
              className="object-cover transition duration-300 group-hover:scale-105"
            />
          </div>
          <p className={cn('mt-4 font-medium', titleClass)}>{room.name}</p>
          <p className={cn('text-muted-foreground', metaClass)}>
            {summarizeBeds(room.beds)} · Up to {room.max_occupancy} guests
          </p>
        </>
      ) : (
        <div className="relative flex aspect-4/3 w-full flex-col justify-end overflow-hidden rounded-2xl bg-linear-to-br from-slate-700 via-slate-800 to-slate-950 p-5 transition duration-300 group-hover:from-slate-600 group-hover:via-slate-700 group-hover:to-slate-900">
          <p className={cn('font-medium text-white', titleClass)}>{room.name}</p>
          <p className={cn('text-white/70', metaClass)}>
            {summarizeBeds(room.beds)} · Up to {room.max_occupancy} guests
          </p>
        </div>
      )}
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
      className={cn(
        'group relative block w-full rounded-2xl text-left transition-shadow',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        selected && 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
      )}
    >
      <div className="relative">
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
          <div className="relative flex aspect-4/3 w-full flex-col justify-end overflow-hidden rounded-2xl bg-linear-to-br from-slate-700 via-slate-800 to-slate-950 p-5 transition duration-300 group-hover:from-slate-600 group-hover:via-slate-700 group-hover:to-slate-900">
            <p className="text-base font-medium text-white">{room.name}</p>
            <p className="text-sm text-white/70">
              {summarizeBeds(room.beds)} · Up to {room.max_occupancy} guests
            </p>
          </div>
        )}
        {selected && (
          <span className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-background shadow-sm">
            <Check className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
      {room.image_url && (
        <>
          <p className="mt-3 text-base font-medium">{room.name}</p>
          <p className="text-sm text-muted-foreground">
            {summarizeBeds(room.beds)} · Up to {room.max_occupancy} guests
          </p>
        </>
      )}
    </button>
  );
}
