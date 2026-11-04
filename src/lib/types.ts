// Row types mirroring supabase/migrations. (Regenerate with `supabase gen types`
// if you want fully generated types; these are the shapes the UI relies on.)

export type UserRole = 'student' | 'admin';
export type QuestionType = 'multiple_choice' | 'true_false' | 'multiple_select' | 'short_answer';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type QuizMode = 'practice' | 'exam';
export type ExamKind = 'unit' | 'subject' | 'mixed' | 'mock';
export type ResourceKind = 'pdf' | 'note' | 'image' | 'reference';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type NotificationKind = 'subject' | 'material' | 'quiz' | 'exam' | 'announcement';
export type ActivityKind =
  | 'unit_opened'
  | 'summary_read'
  | 'unit_completed'
  | 'resource_opened'
  | 'quiz_completed'
  | 'exam_completed';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  school: string | null;
  location: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Subject {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  image_url: string | null;
  position: number;
  is_published: boolean;
  is_demo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SubjectCard {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  image_url: string | null;
  position: number;
  unit_count: number;
  summary_count: number;
  resource_count: number;
  quiz_count: number;
  completed_units: number;
}

export interface Unit {
  id: string;
  subject_id: string;
  number: number;
  position: number;
  title: string;
  description: string;
  introduction: string;
  objectives: string[];
  key_concepts: string[];
  estimated_minutes: number;
  is_published: boolean;
  is_demo: boolean;
}

export interface UnitRow {
  id: string;
  subject_id: string;
  number: number;
  position: number;
  title: string;
  description: string;
  estimated_minutes: number;
  has_summary: boolean;
  resource_count: number;
  quiz_count: number;
  status: ProgressStatus;
  reading_progress: number;
  best_percentage: number | null;
}

export interface Topic {
  id: string;
  unit_id: string;
  title: string;
  description: string;
  position: number;
}

export interface Summary {
  id: string;
  unit_id: string;
  content_html: string;
  status: 'draft' | 'published';
  word_count: number;
  published_at: string | null;
  updated_at: string;
}

export interface LearningResource {
  id: string;
  subject_id: string;
  unit_id: string | null;
  title: string;
  description: string;
  kind: ResourceKind;
  storage_path: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  allow_download: boolean;
  is_published: boolean;
  is_demo?: boolean;
  created_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  unit_id: string | null;
  mode: QuizMode;
  time_limit_minutes: number | null;
  pass_percentage: number;
  shuffle_questions: boolean;
  is_published: boolean;
  is_demo?: boolean;
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  kind: ExamKind;
  subject_id: string | null;
  question_count: number;
  duration_minutes: number;
  pass_percentage: number;
  is_published: boolean;
  is_demo?: boolean;
}

export interface AttemptSummary {
  id: string;
  kind: 'quiz' | 'exam';
  quiz_id: string | null;
  exam_id: string | null;
  title: string;
  subject_id: string | null;
  unit_id: string | null;
  mode: QuizMode;
  status: 'in_progress' | 'submitted';
  total_questions: number;
  score: number | null;
  percentage: number | null;
  pass_percentage: number;
  passed: boolean | null;
  timed_out: boolean;
  duration_seconds: number | null;
  started_at: string;
  submitted_at: string | null;
  expires_at: string | null;
}

// ---- Quiz runner payloads (see get_attempt / get_attempt_result) -------------
export interface RunnerOption {
  id: string;
  body: string;
}
export interface RunnerQuestion {
  id: string;
  type: QuestionType;
  body: string;
  options: RunnerOption[];
}
export interface RunnerAnswer {
  question_id: string;
  selected_option_ids: string[];
  text_answer: string | null;
  checked: boolean;
  is_correct: boolean | null;
  correct_option_ids?: string[] | null;
  accepted_answers?: string[] | null;
  explanation?: string | null;
}
export interface AttemptPayload {
  attempt: {
    id: string;
    kind: 'quiz' | 'exam';
    title: string;
    mode: QuizMode;
    status: 'in_progress' | 'submitted';
    started_at: string;
    expires_at: string | null;
    time_limit_seconds: number | null;
    total_questions: number;
    quiz_id: string | null;
    exam_id: string | null;
    subject_id: string | null;
    unit_id: string | null;
  };
  server_now: string;
  questions: RunnerQuestion[];
  answers: RunnerAnswer[];
}

export interface ResultQuestion {
  id: string;
  type: QuestionType;
  body: string;
  explanation: string;
  accepted_answers: string[] | null;
  options: { id: string; body: string; is_correct: boolean }[];
  selected_option_ids: string[];
  text_answer: string | null;
  is_correct: boolean;
}
export interface ResultPayload {
  attempt: {
    id: string;
    kind: 'quiz' | 'exam';
    title: string;
    mode: QuizMode;
    quiz_id: string | null;
    exam_id: string | null;
    subject_id: string | null;
    unit_id: string | null;
    score: number;
    total_questions: number;
    percentage: number;
    passed: boolean;
    pass_percentage: number;
    timed_out: boolean;
    duration_seconds: number;
    started_at: string;
    submitted_at: string;
  };
  questions: ResultQuestion[];
}

export interface StudentStats {
  total_units: number;
  completed_units: number;
  in_progress_units: number;
  quizzes_completed: number;
  exams_completed: number;
  avg_quiz_score: number | null;
  avg_exam_score: number | null;
  study_streak: number;
  active_days_30: number;
  today: Partial<Record<ActivityKind, number>>;
}

export interface Recommendation {
  unit_id: string;
  unit_number: number;
  unit_title: string;
  estimated_minutes: number;
  subject_id: string;
  subject_slug: string;
  subject_title: string;
  subject_color: string;
  subject_icon: string;
  reason: 'resume' | 'next' | 'review';
  reading_progress: number;
  best_percentage: number | null;
}

export interface NotificationItem {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  link: string | null;
  created_at: string;
  is_read: boolean;
}

export interface SearchResult {
  kind: 'subject' | 'unit' | 'topic' | 'summary' | 'resource';
  id: string;
  title: string;
  snippet: string | null;
  subject_slug: string;
  subject_title: string;
  unit_id: string | null;
  unit_number: number | null;
  unit_title: string | null;
  rank: number;
}

export interface QuestionAdminRow {
  id: string;
  subject_id: string;
  unit_id: string | null;
  topic_id: string | null;
  type: QuestionType;
  body: string;
  explanation: string;
  accepted_answers: string[];
  difficulty: Difficulty;
  created_at: string;
  question_options?: { id: string; body: string; is_correct: boolean; position: number }[];
  subjects?: { title: string } | null;
  units?: { title: string; number: number } | null;
}
