'use client';
import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useT } from '@/i18n/client';
import { cn } from '@/lib/utils';

/** One-tap light/dark switch for headers. The full Light / Dark / System choice lives in the profile menu and Settings. */
export function ThemeToggle({ className }: { className?: string }) {
  const t = useT('common');
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === 'dark';
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  );
}

const OPTIONS = [
  { id: 'light', icon: Sun },
  { id: 'dark', icon: Moon },
  { id: 'system', icon: Monitor },
] as const;

/** Segmented Light / Dark / System selector (Settings page). */
export function ThemeSelect() {
  const t = useT('common');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const current = mounted ? (theme ?? 'system') : null;
  return (
    <div role="radiogroup" aria-label={t('theme.label')} className="grid w-full max-w-md grid-cols-3 gap-1 rounded-xl bg-muted p-1">
      {OPTIONS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={current === id}
          onClick={() => setTheme(id)}
          className={cn(
            'flex min-h-10 min-w-0 flex-col items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-center text-[13px] font-medium leading-tight transition-all sm:flex-row sm:gap-2 sm:text-sm',
            current === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Icon className="size-4 shrink-0" />
          <span className="min-w-0">{t(`theme.${id}`)}</span>
        </button>
      ))}
    </div>
  );
}
