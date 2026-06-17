import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentUser } from '@/lib/auth';
import { isDevAdminPreviewEnabled } from '@/lib/dev-tools';
import { isSiteAdmin } from '@/lib/site-admin';
import {
  isSiteDocumentSlug,
  SITE_DOCUMENT_PATHS,
} from '@/lib/site-documents';
import { legalBodyHasContent } from '@/lib/legal-document-html';

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z
    .string()
    .min(1)
    .refine((value) => legalBodyHasContent(value), {
      message: 'Body cannot be empty',
    })
    .optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const actor = await getCurrentUser();
    if (
      !actor ||
      (!isSiteAdmin(actor) && !isDevAdminPreviewEnabled())
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { slug } = await params;
    if (!isSiteDocumentSlug(slug)) {
      return NextResponse.json({ error: 'Invalid document' }, { status: 400 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    if (!parsed.data.title && !parsed.data.body) {
      return NextResponse.json(
        { error: 'At least one field is required' },
        { status: 400 }
      );
    }

    const updates: {
      title?: string;
      body?: string;
      updated_at: string;
      updated_by: string;
    } = {
      updated_at: new Date().toISOString(),
      updated_by: actor.id,
    };
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.body !== undefined) updates.body = parsed.data.body;

    const admin = createAdminClient();
    const { data: document, error } = await admin
      .from('site_documents')
      .update(updates)
      .eq('slug', slug)
      .select()
      .single();

    if (error || !document) {
      return NextResponse.json(
        { error: error?.message ?? 'Not found' },
        { status: 404 }
      );
    }

    revalidatePath(SITE_DOCUMENT_PATHS[slug]);

    return NextResponse.json({ document });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
