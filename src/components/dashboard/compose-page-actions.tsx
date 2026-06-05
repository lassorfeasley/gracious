import Link from 'next/link';
import { CalendarPlus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Room } from '@/types/database';

export function ComposePageActions({
  slug,
  rooms,
}: {
  slug: string;
  rooms: Room[];
}) {
  const disabled = rooms.length === 0;

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" disabled={disabled} asChild>
        <Link href={`/dashboard/${slug}/compose?mode=manual`}>
          <CalendarPlus className="mr-1 h-4 w-4" />
          Manual stay
        </Link>
      </Button>
      <Button size="sm" disabled={disabled} asChild>
        <Link href={`/dashboard/${slug}/compose?mode=invite`}>
          <UserPlus className="mr-1 h-4 w-4" />
          Invite guest
        </Link>
      </Button>
    </div>
  );
}
