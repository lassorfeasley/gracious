'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import { legalBodyHasContent, plainTextToLegalHtml } from '@/lib/legal-document-html';
import type { SiteDocument } from '@/lib/site-documents';

export function LegalDocumentEditor({ document }: { document: SiteDocument }) {
  const router = useRouter();
  const [title, setTitle] = useState(document.title);
  const [body, setBody] = useState(() => plainTextToLegalHtml(document.body));
  const [pending, setPending] = useState(false);

  async function handleSave() {
    if (!legalBodyHasContent(body)) {
      toast.error('Document body cannot be empty');
      return;
    }

    setPending(true);
    const res = await fetch(`/api/admin/legal/${document.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, body }),
    });
    const data = await res.json();
    setPending(false);

    if (!res.ok) {
      toast.error(
        typeof data.error === 'string' ? data.error : 'Failed to save document'
      );
      return;
    }

    toast.success('Document saved');
    router.refresh();
  }

  return (
    <div className="max-w-3xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="legal-title">Title</Label>
        <Input
          id="legal-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="legal-body">Body</Label>
        <RichTextEditor
          value={body}
          onChange={setBody}
          placeholder="Write your policy here…"
        />
        <p className="text-xs text-muted-foreground">
          Use headings, lists, and links. Existing plain-text documents are
          converted automatically when you open them.
        </p>
      </div>
      <Button onClick={handleSave} disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </div>
  );
}
