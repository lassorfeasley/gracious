'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, Home, Plus, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { storePendingUpgrade } from '@/lib/billing-client';
import { slugify } from '@/lib/slug';
import { Wordmark } from '@/components/brand/wordmark';
import {
  signupSchema,
  BED_SIZES,
  BED_SIZE_LABELS,
} from '@/lib/validations';
import {
  HOME_AMENITY_PRESETS,
  ROOM_AMENITY_PRESETS,
  amenityKey,
} from '@/lib/amenities';
import { cn } from '@/lib/utils';
import type { Amenity } from '@/types/database';
import { AddressAutocomplete } from '@/components/dashboard/address-autocomplete';
import { LocationPicker } from '@/components/dashboard/location-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type BedSize = (typeof BED_SIZES)[number];

interface WizardRoom {
  key: string;
  name: string;
  max_occupancy: number;
  beds: BedSize[];
  amenities: Amenity[];
}

type Step =
  | { kind: 'house' }
  | { kind: 'house-amenities' }
  | { kind: 'rooms' }
  | { kind: 'room-amenities'; roomKey: string; roomIndex: number }
  | { kind: 'account' };

function newRoom(): WizardRoom {
  return {
    key: crypto.randomUUID(),
    name: '',
    max_occupancy: 2,
    beds: ['queen'],
    amenities: [],
  };
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);

  // House
  const [houseName, setHouseName] = useState('');
  const [houseAddress, setHouseAddress] = useState('');
  const [houseLat, setHouseLat] = useState<number | null>(null);
  const [houseLng, setHouseLng] = useState<number | null>(null);
  const [houseAmenities, setHouseAmenities] = useState<Amenity[]>([]);

  // Rooms
  const [rooms, setRooms] = useState<WizardRoom[]>([newRoom()]);

  // Account (deferred to last step)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Steps are dynamic: each room contributes an "amenities" page.
  const steps: Step[] = [
    { kind: 'house' },
    { kind: 'house-amenities' },
    { kind: 'rooms' },
    ...rooms.flatMap((r, i) => [
      { kind: 'room-amenities' as const, roomKey: r.key, roomIndex: i },
    ]),
    { kind: 'account' },
  ];

  const current = Math.min(step, steps.length - 1);
  const currentStep = steps[current];
  const isLast = current === steps.length - 1;
  const progress = ((current + 1) / steps.length) * 100;

  const namedRoomCount = rooms.filter((r) => r.name.trim()).length;

  function stepTitle(s: Step): string {
    switch (s.kind) {
      case 'house':
        return "What's your place called?";
      case 'house-amenities':
        return 'What does your place offer?';
      case 'rooms':
        return 'Add your rooms';
      case 'room-amenities': {
        const room = rooms[s.roomIndex];
        const name = room?.name.trim() || `Room ${s.roomIndex + 1}`;
        return `What does ${name} offer?`;
      }
      case 'account':
        return 'Create your account';
    }
  }

  function updateRoom(key: string, patch: Partial<WizardRoom>) {
    setRooms((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
    );
  }

  function addRoom() {
    setStepError(null);
    setRooms((prev) => [...prev, newRoom()]);
  }

  function removeRoom(key: string) {
    setStepError(null);
    setRooms((prev) => prev.filter((r) => r.key !== key));
  }

  function addBed(key: string) {
    setRooms((prev) =>
      prev.map((r) =>
        r.key === key ? { ...r, beds: [...r.beds, 'queen'] } : r
      )
    );
  }

  function setBed(key: string, index: number, size: BedSize) {
    setRooms((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, beds: r.beds.map((b, i) => (i === index ? size : b)) }
          : r
      )
    );
  }

  function removeBed(key: string, index: number) {
    setRooms((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, beds: r.beds.filter((_, i) => i !== index) }
          : r
      )
    );
  }

  function validateStep(s: Step): string | null {
    if (s.kind === 'house' && !houseName.trim()) {
      return 'Give your place a name';
    }
    if (s.kind === 'rooms') {
      if (rooms.length === 0) {
        return 'Add at least one room';
      }
      if (rooms.some((r) => !r.name.trim())) {
        return 'Give each room a name, or remove it';
      }
    }
    return null;
  }

  function handleNext() {
    const error = validateStep(currentStep);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    setStep(current + 1);
  }

  // Carries "go Pro now" intent (from /signup?upgrade=pro&interval=...) through
  // to the dashboard, which launches Stripe checkout after the account exists.
  function persistUpgradeIntent() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('upgrade') === 'pro') {
      storePendingUpgrade(params.get('interval') === 'monthly' ? 'monthly' : 'annual');
    }
  }

  async function handleCreateAccount() {
    const parsed = signupSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      confirmPassword,
    });
    if (!parsed.success) {
      const first = Object.values(parsed.error.flatten().fieldErrors)
        .flat()
        .find(Boolean);
      setStepError(first ?? 'Check the account details');
      return;
    }

    setStepError(null);
    setLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          first_name: parsed.data.first_name,
          last_name: parsed.data.last_name ?? null,
        },
      },
    });

    // The DB trigger that mirrors auth users into public.users may be missing;
    // fall back to the service-role route and sign in explicitly.
    if (error?.message?.includes('Database error saving new user')) {
      const fallback = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const fallbackData = await fallback.json();
      if (!fallback.ok) {
        setLoading(false);
        toast.error(
          typeof fallbackData.error === 'string'
            ? fallbackData.error
            : 'Signup failed. Run supabase/migrations/002_fix_auth_user_trigger.sql in the Supabase SQL Editor.'
        );
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (signInError) {
        setLoading(false);
        toast.error(signInError.message);
        return;
      }
    } else if (error) {
      setLoading(false);
      // A guest invited earlier already has a (passwordless) account, so signup
      // collides. Send them to sign in — owning a home there pairs to that same
      // account rather than creating a duplicate.
      if (/registered|already|exists/i.test(error.message)) {
        toast.error(
          'You already have a Gracious account with this email. Sign in, then add your home from your dashboard.'
        );
        router.push('/login?redirect=/dashboard');
        return;
      }
      toast.error(error.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      toast.error('Check your email to confirm your account, then sign in.');
      return;
    }

    // owner_id FKs to public.users, so ensure the profile row exists first.
    // Creating the property below is what makes this account a host.
    await supabase.from('users').upsert({
      id: user.id,
      email: parsed.data.email,
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name ?? null,
    });

    const slug = await insertPropertyWithUniqueSlug(supabase, user.id, {
      name: houseName.trim(),
      address: houseAddress.trim() || null,
      latitude: houseLat,
      longitude: houseLng,
      amenities: houseAmenities,
    });
    if (!slug) {
      setLoading(false);
      toast.error('Account created, but we could not set up your place. Try again from the dashboard.');
      router.push('/dashboard');
      router.refresh();
      return;
    }

    const namedRooms = rooms.filter((r) => r.name.trim());
    if (namedRooms.length > 0) {
      const { data: property } = await supabase
        .from('properties')
        .select('id')
        .eq('slug', slug)
        .single();
      if (property) {
        const { error: roomsError } = await supabase.from('rooms').insert(
          namedRooms.map((r, i) => ({
            property_id: property.id,
            name: r.name.trim(),
            max_occupancy: r.max_occupancy,
            beds: r.beds,
            amenities: r.amenities,
            display_order: i,
          }))
        );
        if (roomsError) {
          toast.error('Your place was created, but some rooms could not be added.');
        }
      }
    }

    persistUpgradeIntent();
    toast.success('Welcome! Your place is ready.');
    router.push(`/dashboard/${slug}/overview`);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip">
      <header className="flex flex-col gap-3 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Link href="/" aria-label="Gracious home">
          <Wordmark className="h-5 text-primary" />
        </Link>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-foreground underline">
            Sign in
          </Link>
        </p>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-8">
        <div className="flex h-[min(82vh,760px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border bg-card shadow-sm">
          <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6 pt-10 sm:px-10">
            <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
              {stepTitle(currentStep)}
            </h1>

            {stepError && (
              <div
                role="alert"
                className="mt-4 flex items-center gap-3 rounded-lg border border-destructive/50 bg-white px-4 py-3 text-sm text-foreground/75"
              >
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                <p>{stepError}</p>
              </div>
            )}

            <div className={cn('mt-8', stepError && 'mt-6')}>
              {currentStep.kind === 'house' && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="house-name">Place name</Label>
                    <Input
                      id="house-name"
                      autoFocus
                      placeholder="Lake House"
                      value={houseName}
                      onChange={(e) => {
                        setHouseName(e.target.value);
                        setStepError(null);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="house-address">Address</Label>
                    <AddressAutocomplete
                      id="house-address"
                      value={houseAddress}
                      onChange={setHouseAddress}
                      onPlaceSelect={(place) => {
                        setHouseAddress(place.address);
                        setHouseLat(place.latitude);
                        setHouseLng(place.longitude);
                      }}
                    />
                  </div>
                  <LocationPicker
                    address={houseAddress}
                    latitude={houseLat}
                    longitude={houseLng}
                    onChange={(lat, lng) => {
                      setHouseLat(lat);
                      setHouseLng(lng);
                    }}
                  />
                </div>
              )}

              {currentStep.kind === 'house-amenities' && (
                <div className="space-y-4">
                  <AmenityPills
                    value={houseAmenities}
                    onChange={setHouseAmenities}
                    presets={HOME_AMENITY_PRESETS}
                  />
                </div>
              )}

              {currentStep.kind === 'rooms' && (
                <div className="space-y-4">
                  <div className="space-y-4">
                    {rooms.map((room, roomIndex) => (
                      <div
                        key={room.key}
                        className="space-y-3 rounded-xl border border-border/60 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <Label
                            htmlFor={`room-name-${room.key}`}
                            className="w-16 shrink-0"
                          >
                            Room {roomIndex + 1}
                          </Label>
                          <Input
                            id={`room-name-${room.key}`}
                            className="flex-1"
                            placeholder="Master bedroom"
                            value={room.name}
                            onChange={(e) => {
                              updateRoom(room.key, { name: e.target.value });
                              setStepError(null);
                            }}
                          />
                          {rooms.length > 1 ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                              onClick={() => removeRoom(room.key)}
                              aria-label={`Remove room ${roomIndex + 1}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          ) : (
                            <span className="w-9 shrink-0" aria-hidden />
                          )}
                        </div>

                        <RoomBedsFields
                          room={room}
                          onUpdate={(patch) => updateRoom(room.key, patch)}
                          onAddBed={() => addBed(room.key)}
                          onSetBed={(index, size) => setBed(room.key, index, size)}
                          onRemoveBed={(index) => removeBed(room.key, index)}
                        />
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={addRoom}
                    className="h-auto px-0 text-foreground/70 hover:bg-transparent hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Add another room
                  </Button>
                </div>
              )}

              {currentStep.kind === 'room-amenities' &&
                (() => {
                  const room = rooms[currentStep.roomIndex];
                  if (!room) return null;
                  return (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Tap what this room offers.
                      </p>
                      <AmenityPills
                        value={room.amenities}
                        onChange={(next) =>
                          updateRoom(room.key, { amenities: next })
                        }
                        presets={ROOM_AMENITY_PRESETS}
                      />
                    </div>
                  );
                })()}

              {currentStep.kind === 'account' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-4">
                    <Home className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <p className="text-sm">
                      <span className="font-medium">{houseName || 'Your place'}</span>
                      {namedRoomCount > 0 && (
                        <span className="text-muted-foreground">
                          {' '}
                          · {namedRoomCount}{' '}
                          {namedRoomCount === 1 ? 'room' : 'rooms'}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Last step — create your login so you can manage everything.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First name</Label>
                      <Input
                        id="first-name"
                        autoFocus
                        placeholder="Jane"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          setStepError(null);
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last name (optional)</Label>
                      <Input
                        id="last-name"
                        placeholder="Doe"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          setStepError(null);
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setStepError(null);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setStepError(null);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setStepError(null);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 space-y-5 px-6 pb-7 pt-2 sm:px-10">
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-success transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between">
              {current > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setStepError(null);
                    setStep(current - 1);
                  }}
                  disabled={loading}
                >
                  <ArrowLeft className="mr-1 h-4 w-4" />
                  Back
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="button"
                size="lg"
                onClick={isLast ? handleCreateAccount : handleNext}
                disabled={loading}
              >
                {isLast
                  ? loading
                    ? 'Creating account…'
                    : 'Create account'
                  : 'Next'}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function RoomBedsFields({
  room,
  onUpdate,
  onAddBed,
  onSetBed,
  onRemoveBed,
}: {
  room: WizardRoom;
  onUpdate: (patch: Partial<WizardRoom>) => void;
  onAddBed: () => void;
  onSetBed: (index: number, size: BedSize) => void;
  onRemoveBed: (index: number) => void;
}) {
  const labelClass = 'w-16 shrink-0';

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Label className={labelClass}>Sleeps</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() =>
              onUpdate({
                max_occupancy: Math.max(1, room.max_occupancy - 1),
              })
            }
            disabled={room.max_occupancy <= 1}
          >
            −
          </Button>
          <span className="w-6 text-center text-sm font-medium">
            {room.max_occupancy}
          </span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() =>
              onUpdate({ max_occupancy: room.max_occupancy + 1 })
            }
          >
            +
          </Button>
        </div>
      </div>

      {room.beds.map((bed, bedIndex) => (
        <div key={bedIndex} className="flex items-center gap-3">
          {bedIndex === 0 ? (
            <Label className={labelClass}>Beds</Label>
          ) : (
            <span className={labelClass} aria-hidden />
          )}
          <Select
            value={bed}
            onValueChange={(v) => onSetBed(bedIndex, v as BedSize)}
          >
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {BED_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {BED_SIZE_LABELS[size]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="w-9 shrink-0">
            {bedIndex > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemoveBed(bedIndex)}
                aria-label={`Remove bed ${bedIndex + 1}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <span className={labelClass} aria-hidden />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onAddBed}
          className="h-auto px-0 text-foreground/70 hover:bg-transparent hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Add bed
        </Button>
      </div>
    </div>
  );
}

function AmenityPills({
  value,
  onChange,
  presets,
}: {
  value: Amenity[];
  onChange: (next: Amenity[]) => void;
  presets: string[];
}) {
  const [customInput, setCustomInput] = useState('');
  const selected = new Set(value.map((a) => a.key));
  const presetKeys = new Set(presets.map(amenityKey));
  const customAmenities = value.filter((a) => !presetKeys.has(a.key));

  function addAmenity(label: string) {
    const trimmed = label.trim();
    const key = amenityKey(trimmed);
    if (!key || selected.has(key)) {
      setCustomInput('');
      return;
    }
    onChange([...value, { key, label: trimmed, note: '' }]);
    setCustomInput('');
  }

  function toggle(label: string) {
    const key = amenityKey(label);
    if (!key) return;
    if (selected.has(key)) {
      onChange(value.filter((a) => a.key !== key));
    } else {
      onChange([...value, { key, label, note: '' }]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((preset) => {
          const key = amenityKey(preset);
          const isSelected = selected.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(preset)}
              aria-pressed={isSelected}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                isSelected
                  ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                  : 'border-foreground/30 bg-background text-foreground shadow-xs hover:border-foreground/45 hover:bg-muted/60'
              )}
            >
              {isSelected ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Plus className="h-3.5 w-3.5 text-foreground/65" />
              )}
              {preset}
            </button>
          );
        })}
        {customAmenities.map((amenity) => (
          <button
            key={amenity.key}
            type="button"
            onClick={() => toggle(amenity.label)}
            aria-pressed
            className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
            {amenity.label}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="Add your own…"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addAmenity(customInput);
            }
          }}
        />
        <Button
          type="button"
          variant="secondary"
          className="shrink-0 font-medium"
          onClick={() => addAmenity(customInput)}
          disabled={!customInput.trim()}
        >
          Add
        </Button>
      </div>
    </div>
  );
}

async function insertPropertyWithUniqueSlug(
  supabase: ReturnType<typeof createClient>,
  ownerId: string,
  details: {
    name: string;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    amenities: Amenity[];
  }
): Promise<string | null> {
  const base = slugify(details.name) || 'my-place';
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from('properties').insert({
      owner_id: ownerId,
      slug,
      ...details,
    });
    if (!error) return slug;
    // 23505 = unique_violation (slug already taken); retry with a suffix.
    if (error.code !== '23505') return null;
  }
  return null;
}
