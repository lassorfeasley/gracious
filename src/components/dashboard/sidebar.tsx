'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Calendar,
  DoorOpen,
  Users,
  Inbox,
  Home,
  Settings,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Property } from '@/types/database';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const navItems = [
  { href: 'overview', label: 'Overview', icon: LayoutDashboard },
  { href: 'calendar', label: 'Calendar', icon: Calendar },
  { href: 'rooms', label: 'Rooms', icon: DoorOpen },
  { href: 'guests', label: 'Guests', icon: Users },
  { href: 'requests', label: 'Requests', icon: Inbox },
  { href: 'profile', label: 'House profile', icon: Home },
  { href: 'settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  properties: Property[];
  currentProperty: Property;
}

export function DashboardSidebar({ properties, currentProperty }: SidebarProps) {
  const pathname = usePathname();
  const base = `/dashboard/${currentProperty.slug}`;
  const showSwitcher = properties.length > 1;

  return (
    <aside className="hidden w-64 shrink-0 border-r bg-muted/20 lg:block">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          GuestHouse
        </Link>
      </div>

      {showSwitcher ? (
        <div className="border-b p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span className="truncate">{currentProperty.name}</span>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
              {properties.map((p) => (
                <DropdownMenuItem key={p.id} asChild>
                  <Link href={`/dashboard/${p.slug}/overview`}>{p.name}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="border-b px-4 py-3">
          <p className="truncate text-sm font-medium">{currentProperty.name}</p>
        </div>
      )}

      <nav className="space-y-1 p-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const path = `${base}/${href}`;
          const active = pathname.startsWith(path);
          return (
            <Link
              key={href}
              href={path}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-background font-medium shadow-sm'
                  : 'text-muted-foreground hover:bg-background/50 hover:text-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
