'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { formatDateRange } from '@/lib/dates';
import type { Room, RoomAvailability } from '@/types/database';

interface AvailabilityBlocksProps {
  rooms: Room[];
  blocks: (RoomAvailability & { room?: Room })[];
}

export function AvailabilityBlocks({ rooms, blocks }: AvailabilityBlocksProps) {
  const router = useRouter();
  const [roomId, setRoomId] = useState(rooms[0]?.id ?? '');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  async function addBlock() {
    if (!roomId || !startDate || !endDate) {
      toast.error('Fill in all fields');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('room_availability').insert({
      room_id: roomId,
      start_date: startDate,
      end_date: endDate,
      is_blocked: true,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Block added');
    setStartDate('');
    setEndDate('');
    router.refresh();
  }

  async function removeBlock(id: string) {
    const supabase = createClient();
    await supabase.from('room_availability').delete().eq('id', id);
    toast.success('Block removed');
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Availability blocks</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button onClick={addBlock} disabled={loading}>
            Block dates
          </Button>
        </div>
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No blocks set.</p>
        ) : (
          <ul className="space-y-2">
            {blocks.map((block) => (
              <li
                key={block.id}
                className="flex items-center justify-between rounded border px-3 py-2 text-sm"
              >
                <span>
                  {block.room?.name ?? 'Room'} —{' '}
                  {formatDateRange(block.start_date, block.end_date)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeBlock(block.id)}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
