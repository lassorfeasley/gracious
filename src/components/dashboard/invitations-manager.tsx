'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invitationSchema, type InvitationInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Copy } from 'lucide-react';
import type { Invitation, Room } from '@/types/database';
import { getInviteUrl } from '@/lib/invite-url';
import { formatDate } from '@/lib/dates';

interface InvitationsManagerProps {
  propertyId: string;
  rooms: Room[];
  invitations: Invitation[];
}

export function InvitationsManager({
  propertyId,
  rooms,
  invitations,
}: InvitationsManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [windows, setWindows] = useState<{ start_date: string; end_date: string }[]>([
    { start_date: '', end_date: '' },
  ]);

  const form = useForm<InvitationInput>({
    resolver: zodResolver(invitationSchema),
    defaultValues: {
      guest_email: '',
      guest_name: '',
      type: 'standing',
      message: '',
      room_ids: [],
    },
  });

  const invType = form.watch('type');

  function toggleRoom(roomId: string) {
    const current = form.getValues('room_ids');
    if (current.includes(roomId)) {
      form.setValue(
        'room_ids',
        current.filter((id) => id !== roomId),
        { shouldValidate: true }
      );
    } else {
      form.setValue('room_ids', [...current, roomId], { shouldValidate: true });
    }
  }

  async function onSubmit(values: InvitationInput) {
    setLoading(true);
    const payload = {
      property_id: propertyId,
      ...values,
      windows:
        values.type !== 'standing'
          ? windows.filter((w) => w.start_date && w.end_date)
          : undefined,
    };

    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      toast.error(
        typeof data.error === 'string'
          ? data.error
          : 'Failed to create invitation'
      );
      return;
    }

    toast.success('Invitation sent!');
    setOpen(false);
    form.reset();
    router.refresh();
  }

  async function revoke(invitationId: string) {
    const res = await fetch('/api/invitations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invitation_id: invitationId, action: 'revoke' }),
    });
    if (!res.ok) {
      toast.error('Failed to revoke');
      return;
    }
    toast.success('Invitation revoked');
    router.refresh();
  }

  function copyLink(token: string) {
    navigator.clipboard.writeText(getInviteUrl(token));
    toast.success('Link copied!');
  }

  const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    accepted: 'default',
    expired: 'outline',
    revoked: 'destructive',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Invitations</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={rooms.length === 0}>
              <Plus className="mr-1 h-4 w-4" />
              New invitation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Invite a guest</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="guest_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guest email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guest_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guest name (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invitation type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="standing">Standing — any available dates</SelectItem>
                          <SelectItem value="date_offer">Date offer — specific windows</SelectItem>
                          <SelectItem value="prix_fixe">Prix fixe — fixed dates only</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {invType !== 'standing' && (
                  <div className="space-y-2">
                    <FormLabel>Date windows</FormLabel>
                    {windows.map((w, i) => (
                      <div key={i} className="grid grid-cols-2 gap-2">
                        <Input
                          type="date"
                          value={w.start_date}
                          onChange={(e) => {
                            const next = [...windows];
                            next[i] = { ...next[i], start_date: e.target.value };
                            setWindows(next);
                          }}
                        />
                        <Input
                          type="date"
                          value={w.end_date}
                          onChange={(e) => {
                            const next = [...windows];
                            next[i] = { ...next[i], end_date: e.target.value };
                            setWindows(next);
                          }}
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setWindows([...windows, { start_date: '', end_date: '' }])
                      }
                    >
                      Add window
                    </Button>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="expires_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires (optional)</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Personal message</FormLabel>
                      <FormControl>
                        <Textarea {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormItem>
                  <FormLabel>Rooms included</FormLabel>
                  <div className="space-y-2">
                    {rooms.map((room) => (
                      <label
                        key={room.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={form.watch('room_ids').includes(room.id)}
                          onCheckedChange={() => toggleRoom(room.id)}
                        />
                        {room.name}
                      </label>
                    ))}
                  </div>
                  {form.formState.errors.room_ids && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.room_ids.message}
                    </p>
                  )}
                </FormItem>

                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sending...' : 'Send invitation'}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {rooms.length === 0 && (
        <p className="text-sm text-amber-600">
          Add rooms before creating invitations.
        </p>
      )}

      {invitations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No invitations yet — invite your first guest.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {invitations.map((inv) => (
            <Card key={inv.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-medium">
                    {inv.guest_name ?? inv.guest_email}
                  </p>
                  <p className="text-sm text-muted-foreground">{inv.guest_email}</p>
                  <div className="mt-2 flex gap-2">
                    <Badge variant={statusVariant[inv.status] ?? 'outline'}>
                      {inv.status}
                    </Badge>
                    <Badge variant="outline">{inv.type.replace('_', ' ')}</Badge>
                  </div>
                  {inv.expires_at && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Expires {formatDate(inv.expires_at)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyLink(inv.token)}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    Copy link
                  </Button>
                  {inv.status !== 'revoked' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => revoke(inv.id)}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
