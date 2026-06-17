import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'h2',
  'h3',
  'ul',
  'ol',
  'li',
  'a',
  'blockquote',
  'hr',
];

const ALLOWED_ATTR = ['href', 'target', 'rel'];

export function isHtmlBody(body: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(body);
}

/** Convert legacy plain-text legal documents into HTML for the rich editor. */
export function plainTextToLegalHtml(body: string): string {
  if (!body.trim()) return '<p></p>';
  if (isHtmlBody(body)) return body;

  const escaped = body
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return escaped
    .split(/\n\n+/)
    .map((block) => `<p>${block.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function sanitizeLegalHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
  });
}

export function legalBodyHasContent(body: string): boolean {
  const html = isHtmlBody(body) ? body : plainTextToLegalHtml(body);
  return sanitizeLegalHtml(html).replace(/<[^>]+>/g, '').trim().length > 0;
}
