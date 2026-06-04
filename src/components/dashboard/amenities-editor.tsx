'use client';

import { useMemo, useState } from 'react';
import { Check, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { amenityKey } from '@/lib/amenities';
import type { Amenity } from '@/types/database';

interface AmenitiesEditorProps {
  value: Amenity[];
  onChange: (next: Amenity[]) => void;
  presets: string[];
  notePlaceholder?: string;
}

export function AmenitiesEditor({
  value,
  onChange,
  presets,
  notePlaceholder = 'Add a note (optional)',
}: AmenitiesEditorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedKeys = useMemo(
    () => new Set(value.map((a) => a.key)),
    [value]
  );

  const trimmed = search.trim();
  const exactMatch = presets.some(
    (p) => p.toLowerCase() === trimmed.toLowerCase()
  );

  function addAmenity(label: string) {
    const key = amenityKey(label);
    if (!key || selectedKeys.has(key)) {
      setSearch('');
      return;
    }
    onChange([...value, { key, label: label.trim(), note: '' }]);
    setSearch('');
  }

  function removeAmenity(key: string) {
    onChange(value.filter((a) => a.key !== key));
  }

  function setNote(key: string, note: string) {
    onChange(value.map((a) => (a.key === key ? { ...a, note } : a)));
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <ul className="space-y-2">
          {value.map((amenity) => (
            <li
              key={amenity.key}
              className="flex items-center gap-2 rounded-md border p-2"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{amenity.label}</p>
                <Input
                  value={amenity.note}
                  onChange={(e) => setNote(amenity.key, e.target.value)}
                  placeholder={notePlaceholder}
                  className="mt-1 h-8 text-xs"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeAmenity(amenity.key)}
                aria-label={`Remove ${amenity.label}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Add amenity
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search or type a custom amenity…"
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {trimmed ? (
                  <button
                    type="button"
                    className="mx-auto flex items-center gap-1 text-sm text-foreground hover:underline"
                    onClick={() => addAmenity(trimmed)}
                  >
                    <Plus className="h-4 w-4" />
                    Add &ldquo;{trimmed}&rdquo;
                  </button>
                ) : (
                  'No amenities found.'
                )}
              </CommandEmpty>
              <CommandGroup heading="Suggestions">
                {presets.map((preset) => {
                  const key = amenityKey(preset);
                  const isSelected = selectedKeys.has(key);
                  return (
                    <CommandItem
                      key={key}
                      value={preset}
                      onSelect={() => addAmenity(preset)}
                      disabled={isSelected}
                    >
                      <Check
                        className={cn(
                          'h-4 w-4',
                          isSelected ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      {preset}
                    </CommandItem>
                  );
                })}
                {trimmed && !exactMatch && (
                  <CommandItem
                    value={`__add__${trimmed}`}
                    onSelect={() => addAmenity(trimmed)}
                  >
                    <Plus className="h-4 w-4" />
                    Add &ldquo;{trimmed}&rdquo;
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
