'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users, Home, Settings, Bell, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Property } from '@/types/database';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface DashboardTopNavProps {
  properties: Property[];
  currentProperty: Property;
  requestCount?: number;
}

export function DashboardTopNav({
  properties,
  currentProperty,
  requestCount = 0,
}: DashboardTopNavProps) {
  const pathname = usePathname();
  const base = `/dashboard/${currentProperty.slug}`;
  const showSwitcher = properties.length > 1;

  function isActive(href: string) {
    return pathname.startsWith(`${base}/${href}`);
  }

  const primaryItems = [
    { href: 'overview', label: currentProperty.name, icon: Home },
    { href: 'guests', label: 'Guests', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
        <Link href="/dashboard" className="font-semibold tracking-tight">
          GuestHouse
        </Link>

        {showSwitcher && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Switch property">
                <ChevronDown className="h-4 w-4 opacity-50" />
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
        )}

        <nav className="ml-auto flex items-center gap-1">
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={`${base}/${href}`}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-muted font-medium text-foreground'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}

          <Link
            href={`${base}/requests`}
            aria-label={
              requestCount > 0
                ? `Requests (${requestCount} active)`
                : 'Requests'
            }
            className={cn(
              'relative flex items-center justify-center rounded-md p-2 transition-colors',
              isActive('requests')
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <Bell className="h-5 w-5" />
            {requestCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
            )}
          </Link>

          <Link
            href={`${base}/settings`}
            aria-label="Settings"
            className={cn(
              'flex items-center justify-center rounded-md p-2 transition-colors',
              isActive('settings')
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
            )}
          >
            <Settings className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
