import Link from 'next/link';
import { BookOpenCheck, LineChart, Timer } from 'lucide-react';
import { Logo } from '@/components/brand/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { LanguageSwitcher } from '@/components/language-switcher';
import { isSupabaseConfigured } from '@/lib/env';
import { Rich } from '@/i18n/rich';
import { getT } from '@/i18n/server';

const ICONS = [BookOpenCheck, Timer, LineChart];

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const [t, tc] = await Promise.all([getT('auth'), getT('common')]);
  const points = t.raw<{ title: string; text: string }[]>('layout.points');
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-0.5">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
        <div className="mx-auto flex w-full max-w-[26rem] flex-1 flex-col justify-center py-10">
          {!isSupabaseConfigured && (
            <div className="mb-6 rounded-lg border border-warning/40 bg-warning-soft px-3.5 py-3 text-sm text-warning">
              <Rich text={t('layout.notConfigured')} />
            </div>
          )}
          {children}
        </div>
        <p className="text-center text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">{t('layout.backToHome')}</Link>
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-midnight p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <div aria-hidden className="absolute -end-24 -top-24 size-96 rounded-full bg-secondary/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 -start-16 size-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative max-w-md">
          <p className="text-sm font-semibold uppercase tracking-widest text-white/60">{tc('tagline')}</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight">{t('layout.headline')}</h2>
          <ul className="mt-10 space-y-6">
            {points.map((p, i) => {
              const Icon = ICONS[i] ?? BookOpenCheck;
              return (
                <li key={p.title} className="flex gap-4">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{p.title}</span>
                    <span className="mt-0.5 block text-sm text-white/65">{p.text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
