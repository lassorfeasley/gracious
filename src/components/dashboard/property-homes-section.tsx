'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreatePropertyForm } from '@/components/dashboard/create-property-form';
import type { Property } from '@/types/database';

export function PropertyHomesSection({
  properties,
  currentPropertyId,
  userId,
}: {
  properties: Property[];
  currentPropertyId: string;
  userId: string;
}) {
  return (
    <Card id="homes">
      <CardHeader>
        <CardTitle className="text-base">Your homes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm text-muted-foreground">
          Each home has its own rooms, calendar, and invitations. Switch homes from
          the menu in the top bar.
        </p>

        <ul className="space-y-2">
          {properties.map((p) => {
            const isCurrent = p.id === currentPropertyId;
            const isOwner = p.owner_id === userId;
            return (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-medium">{p.name}</p>
                  {p.address && (
                    <p className="truncate text-sm text-muted-foreground">
                      {p.address}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!isOwner && (
                    <Badge variant="secondary" className="text-xs">
                      Manager
                    </Badge>
                  )}
                  {isCurrent ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Check className="h-3.5 w-3.5" />
                      Current
                    </span>
                  ) : (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/${p.slug}/overview`}>Open</Link>
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium">Add another home</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a separate listing with its own rooms and guest invitations.
          </p>
          <div className="mt-4">
            <CreatePropertyForm userId={userId} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
