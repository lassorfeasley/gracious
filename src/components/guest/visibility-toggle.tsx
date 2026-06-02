'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export function VisibilityToggle({ visible }: { visible: boolean }) {
  const [checked, setChecked] = useState(visible);
  const [loading, setLoading] = useState(false);

  async function onChange(value: boolean) {
    setChecked(value);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('users')
      .update({ visible_to_coguests: value })
      .eq('id', (await supabase.auth.getUser()).data.user?.id ?? '');
    setLoading(false);
    if (error) {
      setChecked(!value);
      toast.error('Failed to update preference');
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="visibility"
        checked={checked}
        onCheckedChange={onChange}
        disabled={loading}
      />
      <Label htmlFor="visibility" className="text-xs text-muted-foreground">
        Visible to co-guests
      </Label>
    </div>
  );
}
