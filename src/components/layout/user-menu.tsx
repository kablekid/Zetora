'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Bell, Check, LayoutDashboard, Languages, LogOut, Monitor, Moon, Settings, ShieldCheck, Sun } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from '@/components/ui/avatar';
import { useLocaleSwitch } from '@/components/language-switcher';
import { LOCALES, LOCALE_META } from '@/i18n/config';
import { useT } from '@/i18n/client';

const THEMES = [
  { id: 'light', icon: Sun },
  { id: 'dark', icon: Moon },
  { id: 'system', icon: Monitor },
] as const;

export function UserMenu({
  name,
  email,
  avatarUrl,
  isAdmin,
  inAdmin,
}: {
  name: string;
  email: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  inAdmin?: boolean;
}) {
  const t = useT('nav');
  const tc = useT('common');
  const { theme, setTheme } = useTheme();
  const { locale, choose } = useLocaleSwitch();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const currentTheme = mounted ? (theme ?? 'system') : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-full p-0.5 outline-none ring-offset-2 transition hover:ring-2 hover:ring-primary/20 focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t('userMenu.open')}
      >
        <UserAvatar name={name} src={avatarUrl} size={36} />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <div className="px-2.5 py-2">
          <p className="truncate text-sm font-semibold">{name}</p>
          <p className="truncate text-xs text-muted-foreground">{email}</p>
        </div>
        <DropdownMenuSeparator />
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link href={inAdmin ? '/dashboard' : '/admin'}>
              {inAdmin ? <LayoutDashboard /> : <ShieldCheck />}
              {inAdmin ? t('userMenu.studentView') : t('userMenu.adminDashboard')}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href="/notifications">
            <Bell /> {t('userMenu.notifications')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings /> {t('userMenu.settings')}
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('userMenu.appearance')}</DropdownMenuLabel>
        {THEMES.map(({ id, icon: Icon }) => (
          <DropdownMenuItem key={id} onSelect={() => setTheme(id)} aria-checked={currentTheme === id} role="menuitemradio">
            <Icon />
            <span className="flex-1">{tc(`theme.${id}`)}</span>
            {currentTheme === id && <Check className="!text-primary" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <DropdownMenuLabel>{t('userMenu.language')}</DropdownMenuLabel>
        {LOCALES.map((l) => (
          <DropdownMenuItem key={l} onSelect={() => choose(l)} lang={l} aria-checked={l === locale} role="menuitemradio">
            <Languages />
            <span className="flex-1">{LOCALE_META[l].label}</span>
            {l === locale && <Check className="!text-primary" />}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />
        <form action="/auth/signout" method="post">
          <DropdownMenuItem asChild destructive>
            <button type="submit" className="w-full">
              <LogOut /> {t('userMenu.signOut')}
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
