'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Check, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

/**
 * The home's title on its overview page, editable in place. The name is
 * home-specific config that used to live in Settings; editing it here keeps the
 * account-level Settings page free of per-home fields.
 */
export function EditableHomeName({
  propertyId,
  name,
}: {
  propertyId: string;
  name: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error('Home name cannot be empty');
      return;
    }
    if (trimmed === name) {
      setEditing(false);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('properties')
      .update({ name: trimmed })
      .eq('id', propertyId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Home name updated');
    setEditing(false);
    router.refresh();
  }

  function cancel() {
    setValue(name);
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') cancel();
          }}
          disabled={saving}
          className="h-auto max-w-md border-0 border-b border-input bg-transparent px-0 py-0 text-3xl font-semibold tracking-tight shadow-none focus-visible:ring-0 sm:text-4xl"
        />
        <Button size="icon" aria-label="Save home name" onClick={save} disabled={saving}>
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          aria-label="Cancel"
          onClick={cancel}
          disabled={saving}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {name}
      </h1>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Edit home name"
        onClick={() => {
          setValue(name);
          setEditing(true);
        }}
        className="text-muted-foreground hover:text-foreground"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
}
