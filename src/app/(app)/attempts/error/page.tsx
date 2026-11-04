import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default async function AttemptErrorPage({ searchParams }: { searchParams: Promise<{ message?: string }> }) {
  const { message } = await searchParams;
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-20 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-warning-soft text-warning"><AlertTriangle className="size-7" /></div>
      <h1 className="mt-5 text-2xl font-bold tracking-tight">We couldn’t start that</h1>
      <p className="mt-2 text-muted-foreground">{message?.slice(0, 200) || 'Something went wrong while starting your attempt.'}</p>
      <Button asChild className="mt-6"><Link href="/subjects">Back to subjects</Link></Button>
    </div>
  );
}
