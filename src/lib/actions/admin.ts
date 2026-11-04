'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { assertAdmin } from '@/lib/auth';
import { fail, type ActionResult } from '@/lib/actions-helpers';
import { sanitizeSummary, countWords } from '@/lib/html';
import {
  announcementSchema, examSchema, questionSchema, quizSchema, resourceSchema, subjectSchema, unitSchema,
} from '@/lib/validators/admin';
import { MAX_PDF_BYTES, MEDIA_BUCKET, RESOURCES_BUCKET } from '@/lib/constants';
import { env } from '@/lib/env';

const uuid = z.uuid();

function friendly(error: { code?: string; message: string }): ActionResult & { ok: false } {
  if (error.code === '23505') {
    if (/slug/.test(error.message)) return { ok: false, error: 'That URL name is already used by another subject.' };
    return { ok: false, error: 'That item already exists.' };
  }
  if (error.code === '23503') return { ok: false, error: 'This item is linked to other content that no longer exists.' };
  if (error.code === '42501') return { ok: false, error: 'You don’t have permission to do that.' };
  return { ok: false, error: error.message };
}

const parse = <T extends z.ZodType>(schema: T, input: unknown): { ok: true; data: z.output<T> } | { ok: false; error: string } => {
  const r = schema.safeParse(input);
  if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? 'Check the form and try again.' };
  return { ok: true, data: r.data };
};

function touch(...paths: string[]) {
  for (const p of paths) revalidatePath(p);
  revalidatePath('/subjects', 'layout');
  revalidatePath('/dashboard');
}

type Supa = Awaited<ReturnType<typeof assertAdmin>>['supabase'];
async function removeObjects(supabase: Supa, bucket: string, paths: string[]) {
  const clean = paths.filter(Boolean);
  if (clean.length) await supabase.storage.from(bucket).remove(clean);
}

// =============================== Subjects ====================================
export async function saveSubjectAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, user } = await assertAdmin();
    const p = parse(subjectSchema, input);
    if (!p.ok) return p;
    const { id, ...fields } = p.data;
    if (id) {
      const { error } = await supabase.from('subjects').update(fields).eq('id', id);
      if (error) return friendly(error);
      touch('/admin/subjects');
      return { ok: true, data: { id }, message: 'Subject saved' };
    }
    const { data: last } = await supabase.from('subjects').select('position').order('position', { ascending: false }).limit(1);
    const position = ((last?.[0]?.position as number | undefined) ?? 0) + 1;
    const { data, error } = await supabase.from('subjects').insert({ ...fields, position, created_by: user.id }).select('id').single();
    if (error) return friendly(error);
    touch('/admin/subjects');
    return { ok: true, data: { id: data.id as string }, message: 'Subject created' };
  } catch (e) {
    return fail(e);
  }
}

export async function setSubjectImageAction(subjectId: string, storagePath: string | null): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!uuid.safeParse(subjectId).success) return fail('Invalid subject.');
    if (storagePath && (!storagePath.startsWith('subjects/') || storagePath.includes('..'))) return fail('Invalid image path.');
    const url = storagePath ? `${env.supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${storagePath}` : null;
    const { error } = await supabase.from('subjects').update({ image_url: url }).eq('id', subjectId);
    if (error) return friendly(error);
    touch('/admin/subjects');
    return { ok: true, message: url ? 'Cover image updated' : 'Cover image removed' };
  } catch (e) {
    return fail(e);
  }
}

export async function setPublishedAction(table: 'subjects' | 'units' | 'learning_resources' | 'quizzes' | 'exams', id: string, published: boolean): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!['subjects', 'units', 'learning_resources', 'quizzes', 'exams'].includes(table) || !uuid.safeParse(id).success) return fail('Invalid request.');
    const { error } = await supabase.from(table).update({ is_published: published }).eq('id', id);
    if (error) return friendly(error);
    touch('/admin', `/admin/${table === 'learning_resources' ? 'materials' : table}`);
    return { ok: true, message: published ? 'Published' : 'Unpublished (hidden from students)' };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteSubjectAction(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!uuid.safeParse(id).success) return fail('Invalid subject.');
    const { data: files } = await supabase.from('learning_resources').select('storage_path').eq('subject_id', id);
    await removeObjects(supabase, RESOURCES_BUCKET, (files ?? []).map((f: { storage_path: string }) => f.storage_path));
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) return friendly(error);
    touch('/admin/subjects', '/admin/units');
    return { ok: true, message: 'Subject deleted' };
  } catch (e) {
    return fail(e);
  }
}

export async function reorderAction(table: 'subjects' | 'units' | 'topics', orderedIds: string[]): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!z.array(uuid).max(500).safeParse(orderedIds).success) return fail('Invalid order.');
    const { error } = await supabase.rpc('admin_set_positions', { p_table: table, p_ids: orderedIds });
    if (error) return friendly(error);
    touch(`/admin/${table}`);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ================================ Units ======================================
export async function saveUnitAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, user } = await assertAdmin();
    const p = parse(unitSchema, input);
    if (!p.ok) return p;
    const { id, topics, ...fields } = p.data;
    let unitId = id;
    if (id) {
      const { error } = await supabase.from('units').update(fields).eq('id', id);
      if (error) return friendly(error);
    } else {
      const { data: last } = await supabase.from('units').select('position').eq('subject_id', fields.subject_id).order('position', { ascending: false }).limit(1);
      const position = ((last?.[0]?.position as number | undefined) ?? 0) + 1;
      const { data, error } = await supabase.from('units').insert({ ...fields, position, created_by: user.id }).select('id').single();
      if (error) return friendly(error);
      unitId = data.id as string;
    }

    // Sync topics by position: reuse existing rows (keeps question tags), add/remove the rest.
    const { data: existing } = await supabase.from('topics').select('id,title,position').eq('unit_id', unitId!).order('position');
    const rows = (existing ?? []) as Array<{ id: string; title: string; position: number }>;
    const keep = new Set<string>();
    for (let i = 0; i < topics.length; i++) {
      const sameTitle = rows.find((r) => r.title === topics[i] && !keep.has(r.id));
      const reuse = sameTitle ?? rows.find((r) => !keep.has(r.id) && !topics.includes(r.title));
      if (reuse) {
        keep.add(reuse.id);
        await supabase.from('topics').update({ title: topics[i], position: i + 1 }).eq('id', reuse.id);
      } else {
        const { data: ins } = await supabase.from('topics').insert({ unit_id: unitId!, title: topics[i], position: i + 1 }).select('id').single();
        if (ins) keep.add(ins.id as string);
      }
    }
    const drop = rows.filter((r) => !keep.has(r.id)).map((r) => r.id);
    if (drop.length) await supabase.from('topics').delete().in('id', drop);

    touch('/admin/units');
    return { ok: true, data: { id: unitId! }, message: id ? 'Unit saved' : 'Unit created' };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteUnitAction(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!uuid.safeParse(id).success) return fail('Invalid unit.');
    const { data: files } = await supabase.from('learning_resources').select('storage_path').eq('unit_id', id);
    await removeObjects(supabase, RESOURCES_BUCKET, (files ?? []).map((f: { storage_path: string }) => f.storage_path));
    const { error } = await supabase.from('units').delete().eq('id', id);
    if (error) return friendly(error);
    touch('/admin/units', '/admin/summaries', '/admin/materials');
    return { ok: true, message: 'Unit deleted' };
  } catch (e) {
    return fail(e);
  }
}

// =============================== Summaries ===================================
export async function saveSummaryAction(unitId: string, html: string, publish: boolean): Promise<ActionResult<{ status: 'draft' | 'published' }>> {
  try {
    const { supabase, user } = await assertAdmin();
    if (!uuid.safeParse(unitId).success) return fail('Invalid unit.');
    if (html.length > 800_000) return fail('This summary is too large. Split it across units or remove large pasted content.');
    const clean = sanitizeSummary(html);
    const words = countWords(clean);
    if (publish && words < 1) return fail('Write something before publishing.');
    const { data: existing } = await supabase.from('summaries').select('id,published_at').eq('unit_id', unitId).maybeSingle();
    const payload = {
      unit_id: unitId,
      content_html: clean,
      word_count: words,
      status: publish ? 'published' : 'draft',
      published_at: publish ? (existing?.published_at ?? new Date().toISOString()) : null,
      updated_by: user.id,
    };
    const { error } = existing
      ? await supabase.from('summaries').update(payload).eq('id', existing.id)
      : await supabase.from('summaries').insert(payload);
    if (error) return friendly(error);
    touch('/admin/summaries', `/admin/summaries/${unitId}`);
    return { ok: true, data: { status: publish ? 'published' : 'draft' }, message: publish ? 'Summary published' : 'Draft saved' };
  } catch (e) {
    return fail(e);
  }
}

export async function unpublishSummaryAction(unitId: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!uuid.safeParse(unitId).success) return fail('Invalid unit.');
    const { error } = await supabase.from('summaries').update({ status: 'draft', published_at: null }).eq('unit_id', unitId);
    if (error) return friendly(error);
    touch('/admin/summaries', `/admin/summaries/${unitId}`);
    return { ok: true, message: 'Summary moved back to draft' };
  } catch (e) {
    return fail(e);
  }
}

// ============================ Learning materials =============================
const fileMeta = z.object({
  storage_path: z.string().min(3).max(300).regex(/^[a-z0-9][a-z0-9._/-]*$/i, 'Invalid file path.').refine((p) => !p.includes('..'), 'Invalid file path.'),
  file_name: z.string().trim().min(1).max(200),
  mime_type: z.enum(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain']),
  file_size: z.number().int().min(1).max(MAX_PDF_BYTES),
});

async function objectExists(supabase: Supa, path: string) {
  const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
  const name = path.slice(path.lastIndexOf('/') + 1);
  const { data } = await supabase.storage.from(RESOURCES_BUCKET).list(dir, { search: name, limit: 5 });
  return Boolean(data?.some((o: { name: string }) => o.name === name));
}

export async function createResourceAction(meta: unknown, file: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, user } = await assertAdmin();
    const m = parse(resourceSchema, meta);
    if (!m.ok) return m;
    const f = parse(fileMeta, file);
    if (!f.ok) return f;
    if (!(await objectExists(supabase, f.data.storage_path))) return fail('The file did not finish uploading. Please try again.');
    const { id: _ignore, ...fields } = m.data;
    void _ignore;
    const { data, error } = await supabase.from('learning_resources').insert({ ...fields, ...f.data, created_by: user.id }).select('id').single();
    if (error) {
      await removeObjects(supabase, RESOURCES_BUCKET, [f.data.storage_path]);
      return friendly(error);
    }
    touch('/admin/materials');
    return { ok: true, data: { id: data.id as string }, message: 'Material uploaded' };
  } catch (e) {
    return fail(e);
  }
}

export async function updateResourceAction(meta: unknown, newFile?: unknown): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    const m = parse(resourceSchema, meta);
    if (!m.ok) return m;
    if (!m.data.id) return fail('Missing material.');
    const { id, ...fields } = m.data;
    const update: Record<string, unknown> = { ...fields };
    let oldPath: string | null = null;
    if (newFile) {
      const f = parse(fileMeta, newFile);
      if (!f.ok) return f;
      if (!(await objectExists(supabase, f.data.storage_path))) return fail('The replacement file did not finish uploading.');
      const { data: cur } = await supabase.from('learning_resources').select('storage_path').eq('id', id).maybeSingle();
      oldPath = (cur?.storage_path as string | undefined) ?? null;
      Object.assign(update, f.data);
    }
    const { error } = await supabase.from('learning_resources').update(update).eq('id', id);
    if (error) {
      if (newFile) await removeObjects(supabase, RESOURCES_BUCKET, [(update.storage_path as string)]);
      return friendly(error);
    }
    if (oldPath && oldPath !== update.storage_path) await removeObjects(supabase, RESOURCES_BUCKET, [oldPath]);
    touch('/admin/materials');
    return { ok: true, message: 'Material saved' };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteResourceAction(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!uuid.safeParse(id).success) return fail('Invalid material.');
    const { data: r } = await supabase.from('learning_resources').select('storage_path').eq('id', id).maybeSingle();
    const { error } = await supabase.from('learning_resources').delete().eq('id', id);
    if (error) return friendly(error);
    if (r?.storage_path) await removeObjects(supabase, RESOURCES_BUCKET, [r.storage_path as string]);
    touch('/admin/materials');
    return { ok: true, message: 'Material deleted' };
  } catch (e) {
    return fail(e);
  }
}

// ================================ Questions ==================================
export async function saveQuestionAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase } = await assertAdmin();
    const p = parse(questionSchema, input);
    if (!p.ok) return p;
    const q = p.data;
    const payload = {
      ...q,
      options: q.type === 'short_answer' ? [] : q.options.filter((o) => o.body.trim()),
      accepted_answers: q.type === 'short_answer' ? q.accepted_answers.filter((a) => a.trim()) : [],
    };
    const { data, error } = await supabase.rpc('admin_save_question', { p: payload });
    if (error) return friendly(error);
    touch('/admin/questions');
    return { ok: true, data: { id: data as string }, message: 'Question saved' };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteQuestionAction(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!uuid.safeParse(id).success) return fail('Invalid question.');
    const { error } = await supabase.from('questions').delete().eq('id', id);
    if (error) return friendly(error);
    touch('/admin/questions', '/admin/quizzes');
    return { ok: true, message: 'Question deleted' };
  } catch (e) {
    return fail(e);
  }
}

// ================================= Quizzes ===================================
export async function saveQuizAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, user } = await assertAdmin();
    const p = parse(quizSchema, input);
    if (!p.ok) return p;
    const { id, question_ids, ...fields } = p.data;
    if (fields.is_published && question_ids.length === 0) return fail('Add at least one question before publishing.');
    let quizId = id;
    if (id) {
      const { error } = await supabase.from('quizzes').update(fields).eq('id', id);
      if (error) return friendly(error);
    } else {
      const { data, error } = await supabase.from('quizzes').insert({ ...fields, created_by: user.id }).select('id').single();
      if (error) return friendly(error);
      quizId = data.id as string;
    }
    const { error: qErr } = await supabase.rpc('admin_set_quiz_questions', { p_quiz_id: quizId, p_question_ids: question_ids });
    if (qErr) return friendly(qErr);
    touch('/admin/quizzes');
    return { ok: true, data: { id: quizId! }, message: 'Quiz saved' };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteQuizAction(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!uuid.safeParse(id).success) return fail('Invalid quiz.');
    const { error } = await supabase.from('quizzes').delete().eq('id', id);
    if (error) return friendly(error);
    touch('/admin/quizzes');
    return { ok: true, message: 'Quiz deleted' };
  } catch (e) {
    return fail(e);
  }
}

// ================================= Exams =====================================
export async function saveExamAction(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const { supabase, user } = await assertAdmin();
    const p = parse(examSchema, input);
    if (!p.ok) return p;
    const { id, unit_ids, ...fields } = p.data;
    // Unit/mixed exams derive their pool from the chosen units; subject/mock from the subject.
    const row = { ...fields, subject_id: fields.kind === 'subject' || fields.kind === 'mock' ? fields.subject_id : fields.kind === 'unit' ? fields.subject_id : null };
    let examId = id;
    if (id) {
      const { error } = await supabase.from('exams').update(row).eq('id', id);
      if (error) return friendly(error);
    } else {
      const { data, error } = await supabase.from('exams').insert({ ...row, created_by: user.id }).select('id').single();
      if (error) return friendly(error);
      examId = data.id as string;
    }
    const ids = fields.kind === 'subject' || fields.kind === 'mock' ? [] : unit_ids;
    const { error: uErr } = await supabase.rpc('admin_set_exam_units', { p_exam_id: examId, p_unit_ids: ids });
    if (uErr) return friendly(uErr);
    touch('/admin/exams', '/exams');
    return { ok: true, data: { id: examId! }, message: 'Exam saved' };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteExamAction(id: string): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    if (!uuid.safeParse(id).success) return fail('Invalid exam.');
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) return friendly(error);
    touch('/admin/exams', '/exams');
    return { ok: true, message: 'Exam deleted' };
  } catch (e) {
    return fail(e);
  }
}

// ================================ Students ===================================
export async function setStudentRoleAction(userId: string, role: 'student' | 'admin'): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    if (!uuid.safeParse(userId).success || !['student', 'admin'].includes(role)) return fail('Invalid request.');
    if (userId === user.id) return fail('You can’t change your own role.');
    const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
    if (error) return friendly(error);
    touch('/admin/students', '/admin/settings');
    return { ok: true, message: role === 'admin' ? 'Promoted to administrator' : 'Changed to student' };
  } catch (e) {
    return fail(e);
  }
}

export async function setStudentActiveAction(userId: string, active: boolean): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    if (!uuid.safeParse(userId).success) return fail('Invalid request.');
    if (userId === user.id) return fail('You can’t suspend your own account.');
    const { error } = await supabase.from('profiles').update({ is_active: active }).eq('id', userId);
    if (error) return friendly(error);
    touch('/admin/students');
    return { ok: true, message: active ? 'Account reactivated' : 'Account suspended' };
  } catch (e) {
    return fail(e);
  }
}

// ================================ Settings ===================================
export async function sendAnnouncementAction(input: unknown): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertAdmin();
    const p = parse(announcementSchema, input);
    if (!p.ok) return p;
    const { error } = await supabase.from('notifications').insert({
      kind: 'announcement', title: p.data.title, body: p.data.body ?? '', link: p.data.link || null, created_by: user.id,
    });
    if (error) return friendly(error);
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Announcement sent to all students' };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteDemoContentAction(): Promise<ActionResult> {
  try {
    const { supabase } = await assertAdmin();
    const { data, error } = await supabase.rpc('admin_delete_demo_content');
    if (error) return friendly(error);
    await removeObjects(supabase, RESOURCES_BUCKET, (data as string[] | null) ?? []);
    revalidatePath('/', 'layout');
    return { ok: true, message: 'Demo content removed' };
  } catch (e) {
    return fail(e);
  }
}
