'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { Property } from '@/types/database';
import { DashboardSidebar } from './sidebar';

interface MobileNavProps {
  properties: Property[];
  currentProperty: Property;
}

export function MobileNav({ properties, currentProperty }: MobileNavProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b px-4 lg:hidden">
      <span className="font-semibold">GuestHouse</span>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 p-0">
          <DashboardSidebar
            properties={properties}
            currentProperty={currentProperty}
          />
        </SheetContent>
      </Sheet>
      <span className="truncate text-sm text-muted-foreground max-w-[40%]">
        {currentProperty.name}
      </span>
    </header>
  );
}
