'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { roomSchema, type RoomInput } from '@/lib/validations';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
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
import type { Room } from '@/types/database';
import { Plus, Trash2 } from 'lucide-react';

interface RoomsManagerProps {
  propertyId: string;
  rooms: Room[];
}

export function RoomsManager({ propertyId, rooms: initialRooms }: RoomsManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<RoomInput>({
    resolver: zodResolver(roomSchema),
    defaultValues: { name: '', description: '', max_occupancy: 2 },
  });

  async function onSubmit(values: RoomInput) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('rooms').insert({
      ...values,
      property_id: propertyId,
      display_order: initialRooms.length,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Room added');
    setOpen(false);
    form.reset();
    router.refresh();
  }

  async function deleteRoom(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from('rooms').delete().eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Room deleted');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Rooms</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />
              Add room
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a room</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Master bedroom" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="max_occupancy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max occupancy</FormLabel>
                      <FormControl>
                        <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={loading}>
                  {loading ? 'Adding...' : 'Add room'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {initialRooms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No rooms yet — add your first room to start inviting guests.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {initialRooms.map((room) => (
            <Card key={room.id}>
              <CardContent className="flex items-start justify-between p-4">
                <div>
                  <p className="font-medium">{room.name}</p>
                  {room.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {room.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Up to {room.max_occupancy} guests
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {room.name}?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This cannot be undone. Existing bookings may be affected.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteRoom(room.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
