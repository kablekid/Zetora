'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { assertUser } from '@/lib/auth';
import { fail, type ActionResult } from '@/lib/actions-helpers';

const uuid = z.uuid();

/** Create/refresh the student's progress row for a unit and log the visit (de-duplicated). */
export async function trackUnitOpened(unitId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertUser();
    if (!uuid.safeParse(unitId).success) return fail('Invalid unit.');

    const { data: existing } = await supabase
      .from('student_progress')
      .select('id,status')
      .eq('user_id', user.id)
      .eq('unit_id', unitId)
      .maybeSingle();

    if (existing) {
      await supabase.from('student_progress').update({ last_accessed_at: new Date().toISOString() }).eq('id', existing.id);
    } else {
      // subject_id is derived by a trigger from the unit; the value here is ignored.
      const { error } = await supabase
        .from('student_progress')
        .insert({ user_id: user.id, unit_id: unitId, subject_id: '00000000-0000-0000-0000-000000000000', status: 'in_progress' });
      if (error) return fail(error);
    }

    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from('activity_log')
      .select('id')
      .eq('user_id', user.id)
      .eq('unit_id', unitId)
      .eq('kind', 'unit_opened')
      .gte('created_at', since)
      .limit(1);
    if (!recent?.length) {
      const { data: unit } = await supabase.from('units').select('title,subject_id').eq('id', unitId).maybeSingle();
      await supabase.from('activity_log').insert({
        user_id: user.id, kind: 'unit_opened', unit_id: unitId, subject_id: unit?.subject_id ?? null, title: unit?.title ?? null,
      });
    }
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Log that the summary was read today (once per unit per day). */
export async function trackSummaryRead(unitId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertUser();
    if (!uuid.safeParse(unitId).success) return fail('Invalid unit.');
    const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
    const { data: recent } = await supabase
      .from('activity_log').select('id')
      .eq('user_id', user.id).eq('unit_id', unitId).eq('kind', 'summary_read').gte('created_at', since).limit(1);
    if (recent?.length) return { ok: true };
    const { data: unit } = await supabase.from('units').select('title,subject_id').eq('id', unitId).maybeSingle();
    if (!unit) return fail('Unit not found.');
    await supabase.from('activity_log').insert({
      user_id: user.id, kind: 'summary_read', unit_id: unitId, subject_id: unit.subject_id, title: unit.title,
    });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Reading progress only ever moves forward, and never on a completed unit. */
export async function saveReadingProgress(unitId: string, percent: number): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertUser();
    if (!uuid.safeParse(unitId).success) return fail('Invalid unit.');
    const value = Math.max(0, Math.min(99, Math.round(percent)));
    const { data: row } = await supabase
      .from('student_progress').select('id,status,reading_progress')
      .eq('user_id', user.id).eq('unit_id', unitId).maybeSingle();
    if (!row) return { ok: true };
    if (row.status === 'completed' || row.reading_progress >= value) return { ok: true };
    await supabase.from('student_progress').update({ reading_progress: value, last_accessed_at: new Date().toISOString() }).eq('id', row.id);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function setUnitCompleted(unitId: string, completed: boolean): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertUser();
    if (!uuid.safeParse(unitId).success) return fail('Invalid unit.');
    const now = new Date().toISOString();
    const { data: unit } = await supabase.from('units').select('id,title,subject_id').eq('id', unitId).maybeSingle();
    if (!unit) return fail('This unit is not available.');

    const { data: row } = await supabase
      .from('student_progress').select('id,status').eq('user_id', user.id).eq('unit_id', unitId).maybeSingle();

    if (row) {
      const { error } = await supabase
        .from('student_progress')
        .update({ status: completed ? 'completed' : 'in_progress', last_accessed_at: now, ...(completed ? {} : { reading_progress: 0 }) })
        .eq('id', row.id);
      if (error) return fail(error);
    } else {
      const { error } = await supabase.from('student_progress').insert({
        user_id: user.id, unit_id: unitId, subject_id: unit.subject_id, status: completed ? 'completed' : 'in_progress',
      });
      if (error) return fail(error);
    }

    if (completed && row?.status !== 'completed') {
      await supabase.from('activity_log').insert({
        user_id: user.id, kind: 'unit_completed', unit_id: unitId, subject_id: unit.subject_id, title: unit.title,
      });
    }
    revalidatePath('/dashboard');
    revalidatePath('/subjects', 'layout');
    revalidatePath('/progress');
    return { ok: true, message: completed ? 'Unit marked as completed 🎉' : 'Unit marked as in progress' };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleBookmark(unitId: string): Promise<ActionResult<{ bookmarked: boolean }>> {
  try {
    const { supabase, user } = await assertUser();
    if (!uuid.safeParse(unitId).success) return fail('Invalid unit.');
    const { data: existing } = await supabase
      .from('bookmarks').select('id').eq('user_id', user.id).eq('unit_id', unitId).maybeSingle();
    if (existing) {
      const { error } = await supabase.from('bookmarks').delete().eq('id', existing.id);
      if (error) return fail(error);
      revalidatePath('/bookmarks');
      return { ok: true, data: { bookmarked: false }, message: 'Bookmark removed' };
    }
    const { error } = await supabase.from('bookmarks').insert({ user_id: user.id, unit_id: unitId });
    if (error) return fail(error);
    revalidatePath('/bookmarks');
    return { ok: true, data: { bookmarked: true }, message: 'Saved to your bookmarks' };
  } catch (e) {
    return fail(e);
  }
}

export async function trackResourceOpened(resourceId: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertUser();
    if (!uuid.safeParse(resourceId).success) return fail('Invalid resource.');
    const { data: r } = await supabase
      .from('learning_resources').select('id,title,subject_id,unit_id').eq('id', resourceId).maybeSingle();
    if (!r) return fail('Resource not found.');
    const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: recent } = await supabase
      .from('activity_log').select('id').eq('user_id', user.id).eq('ref_id', resourceId).eq('kind', 'resource_opened').gte('created_at', since).limit(1);
    if (recent?.length) return { ok: true };
    await supabase.from('activity_log').insert({
      user_id: user.id, kind: 'resource_opened', subject_id: r.subject_id, unit_id: r.unit_id, ref_id: r.id, title: r.title,
    });
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

// ---- Quizzes & exams ---------------------------------------------------------

/** Starts (or resumes) an attempt, then sends the student to the runner. */
export async function startQuizAction(formData: FormData) {
  const quizId = String(formData.get('quizId') ?? '');
  if (!uuid.safeParse(quizId).success) redirect('/subjects');
  const { supabase } = await assertUser();
  const { data, error } = await supabase.rpc('start_quiz_attempt', { p_quiz_id: quizId });
  if (error || !data) {
    redirect(`/attempts/error?message=${encodeURIComponent(error?.message ?? 'Could not start the quiz.')}`);
  }
  redirect(`/attempts/${data}`);
}

export async function startExamAction(formData: FormData) {
  const examId = String(formData.get('examId') ?? '');
  if (!uuid.safeParse(examId).success) redirect('/exams');
  const { supabase } = await assertUser();
  const { data, error } = await supabase.rpc('start_exam_attempt', { p_exam_id: examId });
  if (error || !data) {
    redirect(`/attempts/error?message=${encodeURIComponent(error?.message ?? 'Could not start the exam.')}`);
  }
  redirect(`/attempts/${data}`);
}

const answerSchema = z.object({
  attemptId: uuid,
  questionId: uuid,
  optionIds: z.array(uuid).max(12).default([]),
  text: z.string().max(500).nullish(),
});

export async function saveAnswerAction(input: unknown): Promise<ActionResult> {
  try {
    const parsed = answerSchema.safeParse(input);
    if (!parsed.success) return fail('Invalid answer.');
    const { supabase } = await assertUser();
    const { error } = await supabase.rpc('save_attempt_answer', {
      p_attempt_id: parsed.data.attemptId,
      p_question_id: parsed.data.questionId,
      p_option_ids: parsed.data.optionIds,
      p_text: parsed.data.text ?? null,
    });
    if (error) return { ok: false, error: error.code === 'ZT001' ? 'TIME_UP' : error.message };
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function checkAnswerAction(input: unknown) {
  try {
    const parsed = answerSchema.safeParse(input);
    if (!parsed.success) return fail('Invalid answer.');
    const { supabase } = await assertUser();
    const { data, error } = await supabase.rpc('check_attempt_answer', {
      p_attempt_id: parsed.data.attemptId,
      p_question_id: parsed.data.questionId,
      p_option_ids: parsed.data.optionIds,
      p_text: parsed.data.text ?? null,
    });
    if (error) return { ok: false as const, error: error.code === 'ZT001' ? 'TIME_UP' : error.message };
    return { ok: true as const, data: data as import('@/lib/types').RunnerAnswer };
  } catch (e) {
    return fail(e);
  }
}

const submitSchema = z.object({
  attemptId: uuid,
  answers: z
    .array(z.object({ question_id: uuid, option_ids: z.array(uuid).max(12), text: z.string().max(500).nullish() }))
    .max(300),
});

export async function submitAttemptAction(input: unknown): Promise<ActionResult<{ attemptId: string }>> {
  try {
    const parsed = submitSchema.safeParse(input);
    if (!parsed.success) return fail('Invalid submission.');
    const { supabase } = await assertUser();
    const { error } = await supabase.rpc('submit_attempt', {
      p_attempt_id: parsed.data.attemptId,
      p_answers: parsed.data.answers,
    });
    if (error) return fail(error);
    revalidatePath('/dashboard');
    revalidatePath('/progress');
    revalidatePath('/exams');
    return { ok: true, data: { attemptId: parsed.data.attemptId } };
  } catch (e) {
    return fail(e);
  }
}

// ---- Notifications -----------------------------------------------------------
export async function markNotificationRead(id: string): Promise<ActionResult> {
  try {
    const { supabase, user } = await assertUser();
    if (!uuid.safeParse(id).success) return fail('Invalid notification.');
    const { error } = await supabase
      .from('notification_reads')
      .upsert({ user_id: user.id, notification_id: id }, { onConflict: 'user_id,notification_id', ignoreDuplicates: true });
    if (error) return fail(error);
    revalidatePath('/notifications');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const { supabase } = await assertUser();
    const { error } = await supabase.rpc('mark_all_notifications_read');
    if (error) return fail(error);
    revalidatePath('/notifications');
    revalidatePath('/', 'layout');
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
