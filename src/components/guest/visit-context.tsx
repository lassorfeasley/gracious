'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toast } from 'sonner';
import {
  rangeConflictsWithAvailability,
  type CalendarBlock,
  type CalendarVisit,
  type RoomAvailability,
} from '@/lib/guest-calendar';

interface VisitSelection {
  checkIn: string | null;
  checkOut: string | null;
}

type DateField = 'checkIn' | 'checkOut';

export interface RequestableRoom {
  id: string;
  name: string;
  max_occupancy: number;
}

interface VisitContextValue extends VisitSelection {
  guests: number;
  activeField: DateField | null;
  setRange: (value: VisitSelection) => void;
  setGuests: (n: number) => void;
  setActiveField: (field: DateField | null) => void;
  clear: () => void;
  /** House-level visit only */
  rooms: RequestableRoom[];
  selectedRoomIds: string[];
  toggleRoom: (roomId: string) => void;
  selectAllRooms: () => void;
  lockRoomSelection: boolean;
  combinedVisits: CalendarVisit[];
  combinedBlocks: CalendarBlock[];
  /** Per-room availability for the full in-scope room set (house-level views). */
  roomAvailability: Record<string, RoomAvailability>;
  maxGuests: number;
}

const VisitContext = createContext<VisitContextValue | null>(null);

export function VisitProvider({
  children,
  defaultRange,
  defaultGuests = 1,
  rooms = [],
  roomAvailability = {},
  defaultSelectedRoomIds,
  lockRoomSelection = false,
  /** Per-room pages: cap guests without room list in context. */
  maxGuestsCap,
}: {
  children: ReactNode;
  defaultRange?: VisitSelection;
  defaultGuests?: number;
  rooms?: RequestableRoom[];
  roomAvailability?: Record<string, RoomAvailability>;
  defaultSelectedRoomIds?: string[];
  lockRoomSelection?: boolean;
  maxGuestsCap?: number;
}) {
  const allRoomIds = useMemo(() => rooms.map((r) => r.id), [rooms]);

  const [range, setRange] = useState<VisitSelection>(
    defaultRange ?? { checkIn: null, checkOut: null }
  );
  const [guests, setGuestsState] = useState(defaultGuests);
  const [activeField, setActiveField] = useState<DateField | null>(null);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(
    () => defaultSelectedRoomIds ?? allRoomIds
  );

  const combinedVisits = useMemo(() => {
    const out: CalendarVisit[] = [];
    for (const id of selectedRoomIds) {
      const avail = roomAvailability[id];
      if (avail) out.push(...avail.visits);
    }
    return out;
  }, [selectedRoomIds, roomAvailability]);

  const combinedBlocks = useMemo(() => {
    const out: CalendarBlock[] = [];
    for (const id of selectedRoomIds) {
      const avail = roomAvailability[id];
      if (avail) out.push(...avail.blocks);
    }
    return out;
  }, [selectedRoomIds, roomAvailability]);

  const maxGuests = useMemo(() => {
    if (rooms.length > 0) {
      return (
        rooms
          .filter((r) => selectedRoomIds.includes(r.id))
          .reduce((sum, r) => sum + r.max_occupancy, 0) || 1
      );
    }
    return maxGuestsCap ?? 99;
  }, [rooms, selectedRoomIds, maxGuestsCap]);

  useEffect(() => {
    setGuestsState((g) => Math.min(g, maxGuests));
  }, [maxGuests]);

  const setGuests = useCallback(
    (n: number) => setGuestsState(Math.min(Math.max(1, n), maxGuests)),
    [maxGuests]
  );

  const invalidateRangeIfNeeded = useCallback(
    (visits: CalendarVisit[], blocks: CalendarBlock[]) => {
      setRange((current) => {
        if (
          current.checkIn &&
          current.checkOut &&
          rangeConflictsWithAvailability(
            current.checkIn,
            current.checkOut,
            visits,
            blocks
          )
        ) {
          if (rooms.length > 0) {
            toast.info(
              'Dates cleared — selected rooms are not all available for those dates.'
            );
          }
          return { checkIn: null, checkOut: null };
        }
        return current;
      });
    },
    [rooms.length]
  );

  const toggleRoom = useCallback(
    (roomId: string) => {
      if (lockRoomSelection) return;

      setSelectedRoomIds((prev) => {
        if (prev.includes(roomId) && prev.length === 1) return prev;

        const next = prev.includes(roomId)
          ? prev.filter((id) => id !== roomId)
          : [...prev, roomId];

        const nextVisits: CalendarVisit[] = [];
        const nextBlocks: CalendarBlock[] = [];
        for (const id of next) {
          const avail = roomAvailability[id];
          if (avail) {
            nextVisits.push(...avail.visits);
            nextBlocks.push(...avail.blocks);
          }
        }
        invalidateRangeIfNeeded(nextVisits, nextBlocks);
        return next;
      });
    },
    [lockRoomSelection, roomAvailability, invalidateRangeIfNeeded]
  );

  const selectAllRooms = useCallback(() => {
    if (lockRoomSelection) return;
    setSelectedRoomIds(allRoomIds);
    const nextVisits: CalendarVisit[] = [];
    const nextBlocks: CalendarBlock[] = [];
    for (const id of allRoomIds) {
      const avail = roomAvailability[id];
      if (avail) {
        nextVisits.push(...avail.visits);
        nextBlocks.push(...avail.blocks);
      }
    }
    invalidateRangeIfNeeded(nextVisits, nextBlocks);
  }, [allRoomIds, lockRoomSelection, roomAvailability, invalidateRangeIfNeeded]);

  const value = useMemo<VisitContextValue>(
    () => ({
      checkIn: range.checkIn,
      checkOut: range.checkOut,
      guests,
      activeField,
      setRange,
      setGuests,
      setActiveField,
      clear: () => {
        setRange({ checkIn: null, checkOut: null });
        setActiveField('checkIn');
      },
      rooms,
      selectedRoomIds,
      toggleRoom,
      selectAllRooms,
      lockRoomSelection,
      combinedVisits,
      combinedBlocks,
      roomAvailability,
      maxGuests,
    }),
    [
      range,
      guests,
      activeField,
      setGuests,
      rooms,
      selectedRoomIds,
      toggleRoom,
      selectAllRooms,
      lockRoomSelection,
      combinedVisits,
      combinedBlocks,
      roomAvailability,
      maxGuests,
    ]
  );

  return (
    <VisitContext.Provider value={value}>{children}</VisitContext.Provider>
  );
}

export function useVisit(): VisitContextValue {
  const ctx = useContext(VisitContext);
  if (!ctx) {
    throw new Error('useVisit must be used within a VisitProvider');
  }
  return ctx;
}

/** Like {@link useVisit} but returns null outside a provider instead of throwing. */
export function useOptionalVisit(): VisitContextValue | null {
  return useContext(VisitContext);
}
