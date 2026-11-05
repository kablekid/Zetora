import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getT } from '@/i18n/server';

export async function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  const t = await getT('common');
  return (
    <nav aria-label={t('a11y.breadcrumb')} className="mb-3">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="size-3.5 opacity-60" aria-hidden />}
            {item.href ? (
              <Link href={item.href} className="rounded transition-colors hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="max-w-[16rem] truncate font-medium text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
