'use client';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { setLocaleAction } from '@/lib/actions/locale';
import { LOCALES, LOCALE_META, type Locale } from '@/i18n/config';
import { useLocale, useT } from '@/i18n/client';
import { cn } from '@/lib/utils';

/** Persist the language (cookie + profile) and re-render the page in it. */
export function useLocaleSwitch() {
  const locale = useLocale();
  const router = useRouter();
  const [pending, start] = useTransition();
  function choose(next: Locale) {
    if (next === locale) return;
    start(async () => {
      await setLocaleAction(next);
      router.refresh();
    });
  }
  return { locale, choose, pending };
}

/** Compact header control: EN ▾ / አማ ▾ */
export function LanguageSwitcher({ className, tone = 'default' }: { className?: string; tone?: 'default' | 'dark' }) {
  const t = useT('common');
  const { locale, choose, pending } = useLocaleSwitch();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn('gap-1.5 px-2.5', tone === 'dark' && 'text-white/70 hover:bg-white/10 hover:text-white', className)}
          aria-label={t('language.label')}
          disabled={pending}
        >
          <Languages />
          <span className="text-[13px] font-semibold">{LOCALE_META[locale].short}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-44">
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} onSelect={() => choose(l)} lang={l} aria-current={l === locale}>
            <span className="flex-1">{LOCALE_META[l].label}</span>
            {l === locale && <Check className="!text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Segmented control for the Settings page. */
export function LanguageSelect() {
  const { locale, choose, pending } = useLocaleSwitch();
  const t = useT('common');
  return (
    <div role="radiogroup" aria-label={t('language.label')} className="grid w-full max-w-sm grid-cols-2 gap-1 rounded-xl bg-muted p-1">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          role="radio"
          aria-checked={l === locale}
          lang={l}
          disabled={pending}
          onClick={() => choose(l)}
          className={cn(
            'min-h-10 min-w-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
            l === locale ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {LOCALE_META[l].label}
        </button>
      ))}
    </div>
  );
}
