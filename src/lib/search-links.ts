import type { SearchResult } from '@/lib/types';

export function searchResultHref(r: Pick<SearchResult, 'kind' | 'subject_slug' | 'unit_id'>) {
  const base = `/subjects/${r.subject_slug}`;
  if (r.kind === 'subject' || !r.unit_id) return base;
  const unit = `${base}/units/${r.unit_id}`;
  if (r.kind === 'summary') return `${unit}?tab=summary`;
  if (r.kind === 'resource') return `${unit}?tab=materials`;
  return unit;
}
