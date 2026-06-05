'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  isMapboxGeocodingEnabled,
  searchMapboxPlaces,
  type MapboxPlace,
} from '@/lib/mapbox-geocoding';

export interface AddressPlaceSelection {
  address: string;
  latitude: number;
  longitude: number;
}

interface AddressAutocompleteProps
  extends Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  onPlaceSelect?: (place: AddressPlaceSelection) => void;
}

export const AddressAutocomplete = forwardRef<
  HTMLInputElement,
  AddressAutocompleteProps
>(function AddressAutocomplete(
  {
    value,
    onChange,
    onPlaceSelect,
    className,
    onFocus,
    onBlur,
    onKeyDown,
    placeholder = 'Start typing an address…',
    ...props
  },
  ref
) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<MapboxPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const abortRef = useRef<AbortController | undefined>(undefined);

  const fetchSuggestions = useCallback(async (query: string) => {
    abortRef.current?.abort();

    if (query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      setOpen(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    try {
      const results = await searchMapboxPlaces(query, {
        signal: controller.signal,
      });
      setSuggestions(results);
      setOpen(results.length > 0);
      setHighlightIndex(-1);
    } catch {
      if (!controller.signal.aborted) {
        setSuggestions([]);
        setOpen(false);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(value);
    }, 300);
    return () => {
      clearTimeout(debounceRef.current);
      abortRef.current?.abort();
    };
  }, [value, fetchSuggestions]);

  function selectPlace(place: MapboxPlace) {
    const [lng, lat] = place.center;
    onChange(place.place_name);
    onPlaceSelect?.({
      address: place.place_name,
      latitude: lat,
      longitude: lng,
    });
    setSuggestions([]);
    setOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (open && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightIndex((i) => (i + 1) % suggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightIndex((i) =>
          i <= 0 ? suggestions.length - 1 : i - 1
        );
      } else if (e.key === 'Enter' && highlightIndex >= 0) {
        e.preventDefault();
        selectPlace(suggestions[highlightIndex]);
        return;
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    }
    onKeyDown?.(e);
  }

  if (!isMapboxGeocodingEnabled()) {
    return (
      <Input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
        {...props}
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            if (suggestions.length > 0) setOpen(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            window.setTimeout(() => setOpen(false), 150);
            onBlur?.(e);
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder={placeholder}
          className={className}
          {...props}
        />
      </PopoverAnchor>
      <PopoverContent
        id={listId}
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <ul role="listbox" className="max-h-60 overflow-auto py-1">
          {loading && suggestions.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">
              Searching…
            </li>
          )}
          {suggestions.map((place, i) => (
            <li key={place.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={i === highlightIndex}
                className={cn(
                  'w-full px-3 py-2 text-left text-sm hover:bg-muted',
                  i === highlightIndex && 'bg-muted'
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectPlace(place)}
              >
                <span className="font-medium">{place.text}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {place.place_name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
});
