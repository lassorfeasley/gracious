'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';

interface DeleteRoomButtonProps {
  roomId: string;
  roomName: string;
  /** Where to send the host after deletion. */
  redirectTo: string;
  /** Render a full labeled destructive button instead of an icon. */
  withLabel?: boolean;
}

export function DeleteRoomButton({
  roomId,
  roomName,
  redirectTo,
  withLabel = false,
}: DeleteRoomButtonProps) {
  const router = useRouter();

  async function deleteRoom() {
    const supabase = createClient();
    const { error } = await supabase.from('rooms').delete().eq('id', roomId);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Room deleted');
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {withLabel ? (
          <Button variant="destructive">
            <Trash2 className="mr-1 h-4 w-4" />
            Delete room
          </Button>
        ) : (
          <Button variant="outline" size="icon" aria-label={`Delete ${roomName}`}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {roomName}?</AlertDialogTitle>
          <AlertDialogDescription>
            This cannot be undone. Existing bookings may be affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={deleteRoom}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
