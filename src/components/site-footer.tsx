export function SiteFooter({ name }: { name?: string }) {
  return (
    <footer className="mt-auto border-t bg-muted/20">
      <div className="mx-auto flex h-[200px] max-w-6xl flex-col justify-center gap-2 px-6">
        <p className="font-semibold tracking-tight">{name ?? 'GuestHouse'}</p>
        <p className="text-sm text-muted-foreground">
          {name ? 'Powered by GuestHouse' : 'Private, invitation-only stays.'}
        </p>
      </div>
    </footer>
  );
}
