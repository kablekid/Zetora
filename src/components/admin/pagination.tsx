import { Button } from '@/components/ui/button';

/** Plain server component: links only, so it can take a function prop from server pages. */
export function Pagination({
  page, pageCount, hrefFor,
}: {
  page: number; pageCount: number; hrefFor: (page: number) => string;
}) {
  if (pageCount <= 1) return null;
  return (
    <nav aria-label="Pagination" className="mt-5 flex items-center justify-between gap-3">
      <Button asChild variant="outline" size="sm" className={page <= 1 ? 'pointer-events-none opacity-50' : ''}>
        <a href={hrefFor(page - 1)} aria-disabled={page <= 1}>Previous</a>
      </Button>
      <p className="text-sm text-muted-foreground">Page {page} of {pageCount}</p>
      <Button asChild variant="outline" size="sm" className={page >= pageCount ? 'pointer-events-none opacity-50' : ''}>
        <a href={hrefFor(page + 1)} aria-disabled={page >= pageCount}>Next</a>
      </Button>
    </nav>
  );
}
