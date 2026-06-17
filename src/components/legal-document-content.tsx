import {
  isHtmlBody,
  plainTextToLegalHtml,
  sanitizeLegalHtml,
} from '@/lib/legal-document-html';
import { cn } from '@/lib/utils';

export function LegalDocumentContent({
  body,
  className,
}: {
  body: string;
  className?: string;
}) {
  if (!body.trim()) {
    return (
      <p className={cn('text-sm text-muted-foreground', className)}>
        No content yet.
      </p>
    );
  }

  if (!isHtmlBody(body)) {
    return (
      <div
        className={cn(
          'whitespace-pre-wrap text-sm leading-relaxed text-foreground/90',
          className
        )}
      >
        {body}
      </div>
    );
  }

  const html = sanitizeLegalHtml(body);

  return (
    <div
      className={cn('legal-prose text-sm leading-relaxed text-foreground/90', className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
