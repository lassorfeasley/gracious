import Link from 'next/link';

interface InvitationUsageBannerProps {
  remaining: number;
  limit: number;
  settingsPath: string;
}

export function InvitationUsageBanner({
  remaining,
  limit,
  settingsPath,
}: InvitationUsageBannerProps) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
      <p className="font-medium">
        {remaining} of {limit} free invitation{limit === 1 ? '' : 's'} left
      </p>
      <p className="mt-0.5 text-muted-foreground">
        <Link
          href={settingsPath}
          className="font-medium underline underline-offset-2 hover:text-foreground"
        >
          Upgrade to Pro
        </Link>{' '}
        for unlimited invitations.
      </p>
    </div>
  );
}
