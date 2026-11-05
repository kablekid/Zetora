import { Button } from '@/components/ui/button';
import { getT } from '@/i18n/server';

/** Plain server component: links only, so it can take a function prop from server pages. */
export async function Pagination({
  page, pageCount, hrefFor,
}: {
  page: number; pageCount: number; hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  const t = await getT('admin');
  return (
    <nav aria-label={t('ui.pagination.nav')} className="mt-5 flex items-center justify-between gap-3">
      <Button asChild variant="outline" size="sm" className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
        <a href={hrefFor(page - 1)} aria-disabled={page <= 1}>{t('ui.pagination.previous')}</a>
      </Button>
      <p className="text-sm text-muted-foreground">{t('ui.pagination.pageOf', { page, count: pageCount })}</p>
      <Button asChild variant="outline" size="sm" className={page >= pageCount ? 'pointer-events-none opacity-50' : ''}>
        <a href={hrefFor(page + 1)} aria-disabled={page >= pageCount}>{t('ui.pagination.next')}</a>
      </Button>
    </nav>
  );
}
