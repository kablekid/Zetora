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
import { timeAgo } from '@/lib/utils';

export const metadata: Metadata = { title: 'Overview' };

interface Overview {
  students: number; subjects: number; units: number; published_summaries: number; pdfs: number; questions: number;
  quiz_attempts: number; exam_attempts: number;
  recent_students: Array<{ id: string; full_name: string; email: string; school: string | null; created_at: string }>;
  recent_activity: Array<{ id: string; kind: string; title: string | null; created_at: string; full_name: string; unit_title: string | null; subject_title: string | null }>;
}

const ACTIVITY_VERB: Record<string, string> = {
  unit_opened: 'opened', summary_read: 'read the summary of', unit_completed: 'completed', resource_opened: 'opened material',
  quiz_completed: 'finished quiz', exam_completed: 'finished exam',
};

export default async function AdminOverviewPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('admin_overview');
  if (error) throw error;
  const o = data as Overview;
  const stats = [
    { label: 'Students', value: o.students, icon: Users, href: '/admin/students' },
    { label: 'Subjects', value: o.subjects, icon: Library, href: '/admin/subjects' },
    { label: 'Units', value: o.units, icon: Layers, href: '/admin/units' },
    { label: 'Published summaries', value: o.published_summaries, icon: FileText, href: '/admin/summaries' },
    { label: 'PDFs & materials', value: o.pdfs, icon: FolderOpen, href: '/admin/materials' },
    { label: 'Questions', value: o.questions, icon: HelpCircle, href: '/admin/questions' },
    { label: 'Quiz attempts', value: o.quiz_attempts, icon: ListChecks, href: '/admin/analytics' },
    { label: 'Exam attempts', value: o.exam_attempts, icon: ClipboardCheck, href: '/admin/analytics' },
  ];
  return (
    <div className="animate-fade-up space-y-8">
      <PageHeader
        title="Overview"
        description="A snapshot of your learning platform."
        actions={<><Button asChild variant="outline"><Link href="/admin/units"><Plus /> New unit</Link></Button><Button asChild><Link href="/admin/subjects"><Plus /> New subject</Link></Button></>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="group rounded-xl border bg-card p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:border-input hover:shadow-[var(--shadow-pop)] sm:p-5">
            <div className="flex items-center justify-between text-muted-foreground"><span className="text-xs font-medium">{s.label}</span><s.icon className="size-4" /></div>
            <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{s.value.toLocaleString('en')}</p>
          </Link>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <Card><CardContent>
          <SectionHeading title="Recent registrations" action={<Link href="/admin/students" className="text-sm font-medium text-primary hover:underline">All students</Link>} />
          {o.recent_students.length === 0 ? (
            <EmptyState icon={<UserPlus />} title="No students yet" description="New sign-ups will appear here." className="border-0 bg-transparent py-8" />
          ) : (
            <ul className="divide-y">
              {o.recent_students.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  <UserAvatar name={s.full_name} size={36} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.full_name || s.email}</p><p className="truncate text-xs text-muted-foreground">{s.email}{s.school ? ` · ${s.school}` : ''}</p></div>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(s.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent></Card>
        <Card><CardContent>
          <SectionHeading title="Recent student activity" />
          {o.recent_activity.length === 0 ? (
            <EmptyState icon={<Users />} title="No activity yet" description="Student activity shows up as soon as learners start studying." className="border-0 bg-transparent py-8" />
          ) : (
            <ul className="divide-y">
              {o.recent_activity.map((a) => (
                <li key={a.id} className="flex items-start gap-3 py-3 text-sm">
                  <UserAvatar name={a.full_name} size={32} />
                  <p className="min-w-0 flex-1"><span className="font-medium">{a.full_name}</span> {ACTIVITY_VERB[a.kind] ?? 'did'} <span className="text-muted-foreground">{a.unit_title ?? a.title}</span></p>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}
