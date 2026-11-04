import type { Metadata } from 'next';
import { Search, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { UserAvatar } from '@/components/ui/avatar';
import { PageHeader } from '@/components/page-header';
import { Pagination } from '@/components/admin/ui';
import { StudentRowActions } from '@/components/admin/student-row-actions';
import { requireAdmin } from '@/lib/auth';
import { formatDate, timeAgo } from '@/lib/utils';
import { PAGE_SIZE } from '@/lib/constants';

export const metadata: Metadata = { title: 'Students' };

interface Row {
  id: string; full_name: string; email: string; school: string | null; location: string | null; role: 'student' | 'admin';
  is_active: boolean; created_at: string; last_active: string | null; completed_units: number; attempts: number; avg_score: number | null; total_count: number;
}

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const { q = '', page: pageParam } = await searchParams;
  const { supabase, user } = await requireAdmin();
  const page = Math.max(1, Number(pageParam) || 1);
  const term = q.trim().slice(0, 80);
  const { data, error } = await supabase.rpc('admin_students', { p_search: term || null, p_limit: PAGE_SIZE, p_offset: (page - 1) * PAGE_SIZE });
  if (error) throw error;
  const rows = (data ?? []) as Row[];
  const total = Number(rows[0]?.total_count ?? 0);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (p: number) => `/admin/students?${new URLSearchParams({ ...(term ? { q: term } : {}), page: String(p) })}`;

  return (
    <div className="animate-fade-up">
      <PageHeader title="Students" description={`${total.toLocaleString('en')} ${total === 1 ? 'account' : 'accounts'}${term ? ` matching “${term}”` : ''}.`} />
      <form className="mb-5 flex max-w-lg gap-2" role="search">
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input name="q" defaultValue={term} placeholder="Search by name, email or school" className="pl-9" aria-label="Search students" /></div>
        <Button type="submit" variant="outline">Search</Button>
      </form>

      {rows.length === 0 ? (
        <EmptyState icon={<Users />} title={term ? 'No students match' : 'No students yet'} description={term ? 'Try a different search.' : 'Students appear here after they register.'} />
      ) : (
        <ul className="overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-card)]">
          {rows.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b p-4 last:border-b-0 sm:px-5">
              <div className="flex min-w-0 flex-1 basis-60 items-center gap-3">
                <UserAvatar name={s.full_name} size={40} />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 truncate text-sm font-semibold">{s.full_name || '—'}{s.role === 'admin' && <Badge variant="violet">Admin</Badge>}{!s.is_active && <Badge variant="destructive">Suspended</Badge>}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.email}</p>
                  {(s.school || s.location) && <p className="truncate text-xs text-muted-foreground">{[s.school, s.location].filter(Boolean).join(' · ')}</p>}
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-5 text-xs sm:gap-7">
                <div><dt className="text-muted-foreground">Units done</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums">{s.completed_units}</dd></div>
                <div><dt className="text-muted-foreground">Attempts</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums">{s.attempts}</dd></div>
                <div><dt className="text-muted-foreground">Avg score</dt><dd className="mt-0.5 text-sm font-semibold tabular-nums">{s.avg_score != null ? `${Math.round(Number(s.avg_score))}%` : '—'}</dd></div>
              </dl>
              <div className="hidden w-36 text-xs text-muted-foreground lg:block"><p>Joined {formatDate(s.created_at)}</p><p>{s.last_active ? `Active ${timeAgo(s.last_active)}` : 'No activity yet'}</p></div>
              <StudentRowActions id={s.id} name={s.full_name || s.email} role={s.role} isActive={s.is_active} isSelf={s.id === user.id} />
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pageCount={pageCount} hrefFor={href} />
    </div>
  );
}
