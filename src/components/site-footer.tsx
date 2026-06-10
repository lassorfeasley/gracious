export function SiteFooter({ name }: { name?: string }) {
  return (
    <footer className="mt-auto border-t border-border/60">
      <div className="mx-auto flex h-[200px] max-w-6xl flex-col justify-center gap-2 px-6">
        <p className="font-display text-lg tracking-tight">
          {name ?? 'Gracious'}
        </p>
        <p className="text-sm text-muted-foreground">
          {name ? 'Powered by Gracious' : 'The art of having people to stay.'}
        </p>
      </div>
    </footer>
  );
}
