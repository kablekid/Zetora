import { z } from 'zod';
import { SUBJECT_COLORS, SUBJECT_ICONS } from '@/lib/registry';

const lines = (max: number, itemMax = 200) =>
  z.array(z.string().trim().min(1).max(itemMax)).max(max);

/** Textarea -> array of non-empty trimmed lines. */
export const splitLines = (v: string) => v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);

export const subjectSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, 'Enter a title.').max(120),
  slug: z.string().trim().min(1, 'Enter a URL name.').max(60).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and dashes only.'),
  description: z.string().trim().max(600, 'Keep the description under 600 characters.'),
  icon: z.string().refine((v) => v in SUBJECT_ICONS, 'Choose an icon.'),
  color: z.string().refine((v) => v in SUBJECT_COLORS, 'Choose a colour.'),
  is_published: z.boolean(),
});
export type SubjectInput = z.input<typeof subjectSchema>;

export const unitSchema = z.object({
  id: z.uuid().optional(),
  subject_id: z.uuid('Choose a subject.'),
  number: z.coerce.number().int().min(1).max(999),
  title: z.string().trim().min(1, 'Enter a title.').max(160),
  description: z.string().trim().max(400),
  introduction: z.string().trim().max(5000),
  objectives: lines(20, 300),
  key_concepts: lines(30, 80),
  topics: lines(30, 160),
  estimated_minutes: z.coerce.number().int().min(1).max(1440),
  is_published: z.boolean(),
});
export type UnitInput = z.input<typeof unitSchema>;

export const resourceSchema = z.object({
  id: z.uuid().optional(),
  subject_id: z.uuid('Choose a subject.'),
  unit_id: z.uuid().nullable(),
  title: z.string().trim().min(1, 'Enter a title.').max(160),
  description: z.string().trim().max(600),
  kind: z.enum(['pdf', 'note', 'image', 'reference']),
  allow_download: z.boolean(),
  is_published: z.boolean(),
});
export type ResourceInput = z.input<typeof resourceSchema>;

export const questionSchema = z
  .object({
    id: z.uuid().optional(),
    subject_id: z.uuid('Choose a subject.'),
    unit_id: z.uuid().nullable(),
    topic_id: z.uuid().nullable(),
    type: z.enum(['multiple_choice', 'true_false', 'multiple_select', 'short_answer']),
    body: z.string().trim().min(1, 'Write the question.').max(2000),
    explanation: z.string().trim().max(2000),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    options: z.array(z.object({ id: z.uuid().optional(), body: z.string().trim().max(600), is_correct: z.boolean() })).max(10),
    accepted_answers: z.array(z.string().trim().max(200)).max(20),
  })
  .superRefine((v, ctx) => {
    if (v.type === 'short_answer') {
      if (!v.accepted_answers.some((a) => a.trim())) ctx.addIssue({ code: 'custom', path: ['accepted_answers'], message: 'Add at least one accepted answer.' });
      return;
    }
    const opts = v.options.filter((o) => o.body.trim());
    if (opts.length < 2) ctx.addIssue({ code: 'custom', path: ['options'], message: 'Add at least two answer options.' });
    const correct = opts.filter((o) => o.is_correct).length;
    if (correct === 0) ctx.addIssue({ code: 'custom', path: ['options'], message: 'Mark the correct answer.' });
    if (v.type !== 'multiple_select' && correct > 1) ctx.addIssue({ code: 'custom', path: ['options'], message: 'Only one answer can be correct.' });
  });
export type QuestionInput = z.input<typeof questionSchema>;

export const quizSchema = z.object({
  id: z.uuid().optional(),
  title: z.string().trim().min(1, 'Enter a title.').max(160),
  description: z.string().trim().max(600),
  subject_id: z.uuid('Choose a subject.'),
  unit_id: z.uuid().nullable(),
  mode: z.enum(['practice', 'exam']),
  time_limit_minutes: z.coerce.number().int().min(1).max(360).nullable(),
  pass_percentage: z.coerce.number().int().min(0).max(100),
  shuffle_questions: z.boolean(),
  is_published: z.boolean(),
  question_ids: z.array(z.uuid()).max(300),
});
export type QuizInput = z.input<typeof quizSchema>;

export const examSchema = z
  .object({
    id: z.uuid().optional(),
    title: z.string().trim().min(1, 'Enter a title.').max(160),
    description: z.string().trim().max(600),
    kind: z.enum(['unit', 'subject', 'mixed', 'mock']),
    subject_id: z.uuid().nullable(),
    unit_ids: z.array(z.uuid()).max(100),
    question_count: z.coerce.number().int().min(1).max(200),
    duration_minutes: z.coerce.number().int().min(1).max(360),
    pass_percentage: z.coerce.number().int().min(0).max(100),
    is_published: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if ((v.kind === 'subject' || v.kind === 'mock') && !v.subject_id) ctx.addIssue({ code: 'custom', path: ['subject_id'], message: 'Choose a subject.' });
    if ((v.kind === 'unit' || v.kind === 'mixed') && v.unit_ids.length === 0) ctx.addIssue({ code: 'custom', path: ['unit_ids'], message: 'Choose at least one unit.' });
    if (v.kind === 'unit' && v.unit_ids.length > 1) ctx.addIssue({ code: 'custom', path: ['unit_ids'], message: 'A unit exam covers exactly one unit.' });
  });
export type ExamInput = z.input<typeof examSchema>;

export const announcementSchema = z.object({
  title: z.string().trim().min(1, 'Enter a title.').max(160),
  body: z.string().trim().max(1000),
  link: z.string().trim().max(200).regex(/^(\/[^/].*)?$/, 'Use an in-app link like /subjects.').optional().or(z.literal('')),
});
