import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ClipboardCheck, FileText, FolderOpen, HelpCircle, Layers, Library, ListChecks, Plus, UserPlus, Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader, SectionHeading } from '@/components/page-header';
import { UserAvatar } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/server';
import { getFormat, getT, pageTitle } from '@/i18n/server';
import { Slots } from '@/i18n/rich';

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle('adminPages.overview') };
}

const ACTIVITY_KINDS: Record<string, true> = { unit_opened: true, summary_read: true, unit_completed: true, resource_opened: true, quiz_completed: true, exam_completed: true };

interface Overview {
  students: number; subjects: number; units: number; published_summaries: number; pdfs: number; questions: number;
  quiz_attempts: number; exam_attempts: number;
  recent_students: Array<{ id: string; full_name: string; email: string; school: string | null; created_at: string }>;
  recent_activity: Array<{ id: string; kind: string; title: string | null; created_at: string; full_name: string; unit_title: string | null; subject_title: string | null }>;
}

export default async function AdminOverviewPage() {
  const [supabase, t, f] = await Promise.all([createClient(), getT('admin'), getFormat()]);
  const { data, error } = await supabase.rpc('admin_overview');
  if (error) throw error;
  const o = data as Overview;
  const stats = [
    { label: t('pages.overview.stats.students'), value: o.students, icon: Users, href: '/admin/students' },
    { label: t('pages.overview.stats.subjects'), value: o.subjects, icon: Library, href: '/admin/subjects' },
    { label: t('pages.overview.stats.units'), value: o.units, icon: Layers, href: '/admin/units' },
    { label: t('pages.overview.stats.summaries'), value: o.published_summaries, icon: FileText, href: '/admin/summaries' },
    { label: t('pages.overview.stats.materials'), value: o.pdfs, icon: FolderOpen, href: '/admin/materials' },
    { label: t('pages.overview.stats.questions'), value: o.questions, icon: HelpCircle, href: '/admin/questions' },
    { label: t('pages.overview.stats.quizAttempts'), value: o.quiz_attempts, icon: ListChecks, href: '/admin/analytics' },
    { label: t('pages.overview.stats.examAttempts'), value: o.exam_attempts, icon: ClipboardCheck, href: '/admin/analytics' },
  ];
  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title={(await getT('meta'))('adminPages.overview')}
        description={t('pages.overview.description')}
        actions={<><Button asChild variant="outline"><Link href="/admin/units"><Plus /> {t('pages.overview.newUnit')}</Link></Button><Button asChild><Link href="/admin/subjects"><Plus /> {t('pages.overview.newSubject')}</Link></Button></>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-xl border bg-card p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:border-input hover:shadow-[var(--shadow-pop)] sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground"><span className="text-xs font-medium">{s.label}</span><s.icon className="size-4" /></div>
            <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{f.number(s.value)}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card><CardContent>
          <SectionHeading title={t('pages.overview.recentRegistrations')} action={<Link href="/admin/students" className="text-sm font-medium text-primary hover:underline">{t('pages.overview.allStudents')}</Link>} />
          {o.recent_students.length === 0 ? (
            <EmptyState icon={<UserPlus />} title={t('pages.overview.noStudentsTitle')} description={t('pages.overview.noStudentsBody')} className="border-0 bg-transparent py-8" />
          ) : (
            <ul className="divide-y">
              {o.recent_students.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  <UserAvatar name={s.full_name} size={36} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.full_name || s.email}</p><p className="truncate text-xs text-muted-foreground">{s.email}{s.school ? ` · ${s.school}` : ''}</p></div>
                  <span className="shrink-0 text-xs text-muted-foreground">{f.timeAgo(s.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent></Card>
        <Card><CardContent>
          <SectionHeading title={t('pages.overview.recentActivity')} />
          {o.recent_activity.length === 0 ? (
            <EmptyState icon={<Users />} title={t('pages.overview.noActivityTitle')} description={t('pages.overview.noActivityBody')} className="border-0 bg-transparent py-8" />
          ) : (
            <ul className="divide-y">
              {o.recent_activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-3 text-sm">
                  <UserAvatar name={a.full_name} size={32} />
                  <p className="min-w-0 flex-1"><Slots text={t.raw<string>(`pages.overview.activity.${a.kind in ACTIVITY_KINDS ? a.kind : 'other'}`)} slots={{ name: <span className="font-medium">{a.full_name}</span>, what: <span className="text-muted-foreground">{a.unit_title ?? a.title}</span> }} /></p>
                  <span className="shrink-0 text-xs text-muted-foreground">{f.timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}
