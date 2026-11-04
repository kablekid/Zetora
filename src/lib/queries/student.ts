import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type {
  AttemptSummary, Exam, LearningResource, NotificationItem, Quiz, Recommendation, SearchResult, StudentStats,
  Subject, Summary, Topic, Unit, UnitRow,
} from '@/lib/types';

type Rel<T> = T | T[] | null;
/** PostgREST returns a many-to-one embed as an object; normalise defensively. */
export function one<T>(rel: Rel<T> | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0] ?? null) : rel;
}

export async function getSubjectBySlug(slug: string): Promise<Subject | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('subjects')
    .select('id,slug,title,description,icon,color,image_url,position,is_published,is_demo')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();
  return (data as Subject | null) ?? null;
}

export async function getSubjectUnits(subjectId: string): Promise<UnitRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_subject_units', { p_subject_id: subjectId });
  if (error) throw error;
  return (data ?? []) as UnitRow[];
}

export async function getStudentStats(): Promise<StudentStats> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_student_stats');
  if (error) throw error;
  return data as StudentStats;
}

export async function getRecommendations(limit = 4): Promise<Recommendation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_recommendations', { p_limit: limit });
  if (error) throw error;
  return (data ?? []) as Recommendation[];
}

export interface ContinueItem {
  unit_id: string;
  status: 'in_progress' | 'completed';
  reading_progress: number;
  last_accessed_at: string;
  unit: { id: string; number: number; title: string; estimated_minutes: number };
  subject: { slug: string; title: string; color: string; icon: string };
}

/** Most recently opened units (that are still published). */
export async function getRecentUnits(limit = 5): Promise<ContinueItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('student_progress')
    .select('unit_id,status,reading_progress,last_accessed_at,units(id,number,title,estimated_minutes,subjects(slug,title,color,icon))')
    .order('last_accessed_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  const out: ContinueItem[] = [];
  for (const row of (data ?? []) as unknown as Array<{
    unit_id: string; status: 'in_progress' | 'completed'; reading_progress: number; last_accessed_at: string;
    units: Rel<{ id: string; number: number; title: string; estimated_minutes: number; subjects: Rel<ContinueItem['subject']> }>;
  }>) {
    const unit = one(row.units);
    const subject = unit ? one(unit.subjects) : null;
    if (!unit || !subject) continue;
    out.push({
      unit_id: row.unit_id, status: row.status, reading_progress: row.reading_progress, last_accessed_at: row.last_accessed_at,
      unit: { id: unit.id, number: unit.number, title: unit.title, estimated_minutes: unit.estimated_minutes }, subject,
    });
  }
  return out;
}

export interface ActivityItem {
  id: string;
  kind: string;
  title: string | null;
  created_at: string;
  ref_id: string | null;
  unit_id: string | null;
  meta: { percentage?: number; passed?: boolean } | null;
  unit: { number: number; title: string } | null;
  subject: { slug: string; title: string; color: string } | null;
}

export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('activity_log')
    .select('id,kind,title,created_at,ref_id,unit_id,meta,units(number,title),subjects(slug,title,color)')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as unknown as Array<{
    id: string; kind: string; title: string | null; created_at: string; ref_id: string | null; unit_id: string | null;
    meta: ActivityItem['meta'];
    units: Rel<{ number: number; title: string }>; subjects: Rel<{ slug: string; title: string; color: string }>;
  }>).map((r) => ({
    id: r.id, kind: r.kind, title: r.title, created_at: r.created_at, ref_id: r.ref_id, unit_id: r.unit_id, meta: r.meta,
    unit: one(r.units), subject: one(r.subjects),
  }));
}

export async function getScoreHistory(limit = 12) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('attempts')
    .select('id,kind,title,percentage,submitted_at,subject_id')
    .eq('status', 'submitted')
    .order('submitted_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []) as Array<{ id: string; kind: 'quiz' | 'exam'; title: string; percentage: number; submitted_at: string; subject_id: string | null }>).reverse();
}

export async function getSubjectPerformance() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_subject_performance');
  if (error) throw error;
  return (data ?? []) as Array<{ subject_id: string; slug: string; title: string; color: string; attempts: number; avg_percentage: number; best_percentage: number }>;
}

export async function getActivityByDay(days = 14) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_activity_by_day', { p_days: days });
  if (error) throw error;
  return (data ?? []) as Array<{ day: string; activities: number; quizzes: number }>;
}

export async function getTopicPerformance() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_topic_performance');
  if (error) throw error;
  return (data ?? []) as Array<{
    area_id: string; area_type: 'topic' | 'unit'; area_title: string; subject_id: string; subject_title: string;
    subject_color: string; answered: number; correct: number; accuracy: number;
  }>;
}

// ---- Unit page -------------------------------------------------------------
export interface UnitBundle {
  unit: Unit;
  subject: Subject;
  topics: Topic[];
  summary: Summary | null;
  resources: LearningResource[];
  quizzes: Array<Quiz & { question_count: number; attempts: AttemptSummary[] }>;
  exams: Exam[];
  siblings: Array<{ id: string; number: number; title: string }>;
  progress: { status: 'in_progress' | 'completed'; reading_progress: number } | null;
  bookmarked: boolean;
}

export async function getUnitBundle(subjectSlug: string, unitId: string, tab: string): Promise<UnitBundle | null> {
  const supabase = await createClient();
  const subject = await getSubjectBySlug(subjectSlug);
  if (!subject) return null;

  const { data: unitRow } = await supabase
    .from('units')
    .select('id,subject_id,number,position,title,description,introduction,objectives,key_concepts,estimated_minutes,is_published,is_demo')
    .eq('id', unitId)
    .eq('subject_id', subject.id)
    .eq('is_published', true)
    .maybeSingle();
  if (!unitRow) return null;
  const unit = unitRow as Unit;

  const [topicsRes, siblingsRes, progressRes, bookmarkRes, summaryRes, resourcesRes, quizzesRes, examsRes] =
    await Promise.all([
      supabase.from('topics').select('id,unit_id,title,description,position').eq('unit_id', unit.id).order('position'),
      supabase.from('units').select('id,number,title,position').eq('subject_id', subject.id).eq('is_published', true).order('position').order('number'),
      supabase.from('student_progress').select('status,reading_progress').eq('unit_id', unit.id).maybeSingle(),
      supabase.from('bookmarks').select('id').eq('unit_id', unit.id).maybeSingle(),
      // Only the active tab needs the heavy payload.
      tab === 'summary'
        ? supabase.from('summaries').select('id,unit_id,content_html,status,word_count,published_at,updated_at').eq('unit_id', unit.id).eq('status', 'published').maybeSingle()
        : supabase.from('summaries').select('id,unit_id,status,word_count,published_at,updated_at').eq('unit_id', unit.id).eq('status', 'published').maybeSingle(),
      supabase.from('learning_resources').select('id,subject_id,unit_id,title,description,kind,storage_path,file_name,mime_type,file_size,allow_download,is_published,created_at').eq('unit_id', unit.id).eq('is_published', true).order('created_at'),
      supabase.from('quizzes').select('id,title,description,subject_id,unit_id,mode,time_limit_minutes,pass_percentage,shuffle_questions,is_published').eq('unit_id', unit.id).eq('is_published', true).order('created_at'),
      supabase.from('exam_units').select('exams(id,title,description,kind,subject_id,question_count,duration_minutes,pass_percentage,is_published)').eq('unit_id', unit.id),
    ]);

  const quizzes = ((quizzesRes.data ?? []) as Quiz[]);
  const counts = new Map<string, number>();
  let attemptsByQuiz = new Map<string, AttemptSummary[]>();
  if (quizzes.length) {
    const { data: qq } = await supabase.from('quiz_questions').select('quiz_id').in('quiz_id', quizzes.map((q) => q.id));
    for (const r of (qq ?? []) as Array<{ quiz_id: string }>) counts.set(r.quiz_id, (counts.get(r.quiz_id) ?? 0) + 1);
    const { data: attempts } = await supabase
      .from('attempts')
      .select('id,kind,quiz_id,exam_id,title,subject_id,unit_id,mode,status,total_questions,score,percentage,pass_percentage,passed,timed_out,duration_seconds,started_at,submitted_at,expires_at')
      .in('quiz_id', quizzes.map((q) => q.id))
      .order('started_at', { ascending: false });
    attemptsByQuiz = new Map();
    for (const a of (attempts ?? []) as AttemptSummary[]) {
      if (!a.quiz_id) continue;
      attemptsByQuiz.set(a.quiz_id, [...(attemptsByQuiz.get(a.quiz_id) ?? []), a]);
    }
  }

  const exams = ((examsRes.data ?? []) as unknown as Array<{ exams: Rel<Exam> }>)
    .map((r) => one(r.exams))
    .filter((e): e is Exam => !!e && e.is_published);

  return {
    unit,
    subject,
    topics: (topicsRes.data ?? []) as Topic[],
    summary: (summaryRes.data as Summary | null) ?? null,
    resources: (resourcesRes.data ?? []) as LearningResource[],
    quizzes: quizzes.map((q) => ({ ...q, question_count: counts.get(q.id) ?? 0, attempts: attemptsByQuiz.get(q.id) ?? [] })),
    exams,
    siblings: (siblingsRes.data ?? []) as Array<{ id: string; number: number; title: string }>,
    progress: (progressRes.data as UnitBundle['progress']) ?? null,
    bookmarked: Boolean(bookmarkRes.data),
  };
}

// ---- Misc ------------------------------------------------------------------
export async function getNotifications(limit = 40): Promise<NotificationItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_notifications', { p_limit: limit });
  if (error) throw error;
  return (data ?? []) as NotificationItem[];
}

export async function getUnreadCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc('unread_notification_count');
    return typeof data === 'number' ? data : 0;
  } catch {
    return 0;
  }
}

export async function searchContent(q: string, limit = 24): Promise<SearchResult[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('search_content', { p_query: q, p_limit: limit });
  if (error) throw error;
  return (data ?? []) as SearchResult[];
}
