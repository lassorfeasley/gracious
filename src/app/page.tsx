import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user?.role === 'owner') redirect('/dashboard');
  if (user) redirect('/my-trips');

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <span className="text-lg font-semibold tracking-tight">GuestHouse</span>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get started</Link>
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Share your second home
          <br />
          <span className="text-muted-foreground">with people you trust</span>
        </h1>
        <p className="mx-auto mt-6 max-w-lg text-lg text-muted-foreground">
          GuestHouse is a private, invitation-only platform for vacation homeowners
          to manage stays with friends and family. Never public. Always personal.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">Create your account</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
