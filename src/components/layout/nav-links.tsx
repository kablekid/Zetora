'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from './nav-config';

function isActive(pathname: string, item: NavItem) {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(item.href + '/');
}

export function SidebarLinks({
  items,
  tone = 'light',
  badge,
  onNavigate,
}: {
  items: NavItem[];
  tone?: 'light' | 'dark';
  badge?: Record<string, number>;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        const count = badge?.[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
              tone === 'light'
                ? active
                  ? 'bg-primary-soft text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                : active
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:bg-white/[0.06] hover:text-white',
            )}
          >
            {active && (
              <span
                aria-hidden
                className={cn(
                  'absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full',
                  tone === 'light' ? 'bg-primary' : 'bg-accent',
                )}
              />
            )}
            <Icon className="size-[18px] shrink-0" />
            <span className="truncate">{item.label}</span>
            {count ? (
              <span className="ml-auto rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                {count > 99 ? '99+' : count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const visible = items.filter((i) => i.mobile);
  return (
    <nav
      aria-label="Primary"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/85 lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {visible.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <span
                  className={cn(
                    'flex h-7 w-12 items-center justify-center rounded-full transition-colors',
                    active && 'bg-primary-soft',
                  )}
                >
                  <Icon className="size-[19px]" strokeWidth={active ? 2.4 : 2} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
