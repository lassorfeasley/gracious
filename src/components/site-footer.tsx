import { Wordmark } from '@/components/brand/wordmark';
import { LegalFooterLinks } from '@/components/legal-footer-links';

export function SiteFooter({ name }: { name?: string }) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex min-h-[200px] max-w-6xl flex-col justify-center gap-4 px-6 py-8">
        {name ? (
          <p className="font-display text-lg tracking-tight">{name}</p>
        ) : (
          <Wordmark className="h-5 text-primary" />
        )}
        {name && (
          <p className="text-sm text-muted-foreground">Powered by Gracious</p>
        )}
        <LegalFooterLinks />
        <p className="text-xs text-muted-foreground">© {year} Gracious</p>
      </div>
    </footer>
  );
}
