import Link from 'next/link';
import { Compass } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 py-16 text-center">
      <Logo />
      <div className="mt-12 flex size-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
        <Compass className="size-8" />
      </div>
      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">We couldn’t find that page</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        The link may be broken, or the lesson may have been moved or unpublished. Let’s get you back on track.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
