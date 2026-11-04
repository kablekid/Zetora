import Link from 'next/link';
import { BookOpenCheck, LineChart, Timer } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { isSupabaseConfigured } from '@/lib/env';
import { APP_TAGLINE } from '@/lib/constants';

const POINTS = [
  { icon: BookOpenCheck, title: 'Study unit by unit', text: 'Clear summaries and materials, organised by subject.' },
  { icon: Timer, title: 'Practice and test yourself', text: 'Quizzes with instant feedback and timed mock exams.' },
  { icon: LineChart, title: 'See your progress', text: 'Know exactly which topics to revise next.' },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-10">
          {!isSupabaseConfigured && (
            <div className="mb-6 rounded-lg border border-warning/40 bg-warning-soft px-3.5 py-3 text-sm text-warning">
              Supabase isn’t configured yet. Add your keys to <code className="font-semibold">.env.local</code> — see the README.
            </div>
          )}
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">← Back to Zetora</Link>
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-midnight p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <div aria-hidden className="absolute -right-24 -top-24 size-96 rounded-full bg-secondary/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -left-16 size-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative max-w-md">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/60">{APP_TAGLINE}</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight">
            Your journey to academic excellence starts here.
          </h2>
          <ul className="mt-10 space-y-6">
            {POINTS.map((p) => (
              <li key={p.title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <p.icon className="size-5" />
                </span>
                <span>
                  <span className="block font-semibold">{p.title}</span>
                  <span className="mt-0.5 block text-sm text-white/65">{p.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
