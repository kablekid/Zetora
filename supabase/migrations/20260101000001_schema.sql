-- =============================================================================
-- Zetora — core schema
-- Learn. Practice. Achieve.
--
-- Conventions
--   * Every table has a uuid primary key and created_at / updated_at where useful.
--   * Content tables carry is_published (and is_demo for removable sample data).
--   * Students never write learning content; admins do (enforced by RLS in 0002).
--   * Anything that must stay secret from students until submission (correct
--     answers, explanations) lives in admin-only tables and is only reachable
--     through SECURITY DEFINER functions (see 0003).
-- =============================================================================

create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role         as enum ('student', 'admin');
create type public.content_status    as enum ('draft', 'published');
create type public.resource_kind     as enum ('pdf', 'note', 'image', 'reference');
create type public.question_type     as enum ('multiple_choice', 'true_false', 'multiple_select', 'short_answer');
create type public.difficulty_level  as enum ('easy', 'medium', 'hard');
create type public.quiz_mode         as enum ('practice', 'exam');
create type public.exam_kind         as enum ('unit', 'subject', 'mixed', 'mock');
create type public.attempt_kind      as enum ('quiz', 'exam');
create type public.attempt_status    as enum ('in_progress', 'submitted');
create type public.progress_status   as enum ('in_progress', 'completed');
create type public.activity_kind     as enum ('unit_opened', 'summary_read', 'unit_completed', 'resource_opened', 'quiz_completed', 'exam_completed');
create type public.notification_kind as enum ('subject', 'material', 'quiz', 'exam', 'announcement');

-- -----------------------------------------------------------------------------
-- Shared trigger: keep updated_at fresh
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles — one row per auth user
-- -----------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text not null default '',
  full_name   text not null default '',
  avatar_url  text,
  school      text,
  location    text,
  role        public.user_role not null default 'student',
  is_active   boolean not null default true,
  locale      text not null default 'en',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint profiles_full_name_len check (char_length(full_name) <= 120),
  constraint profiles_school_len check (school is null or char_length(school) <= 160),
  constraint profiles_location_len check (location is null or char_length(location) <= 160)
);
create index profiles_role_idx on public.profiles (role);
create index profiles_created_at_idx on public.profiles (created_at desc);
create index profiles_name_trgm_idx on public.profiles using gin (full_name extensions.gin_trgm_ops);
create index profiles_email_trgm_idx on public.profiles using gin (email extensions.gin_trgm_ops);
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- subjects
-- -----------------------------------------------------------------------------
create table public.subjects (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  description   text not null default '',
  icon          text not null default 'book-open',   -- key into the icon registry in the app
  color         text not null default 'indigo',      -- key into the colour registry in the app
  image_url     text,                                -- optional cover (public media bucket)
  position      integer not null default 0,
  is_published  boolean not null default false,
  is_demo       boolean not null default false,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint subjects_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint subjects_title_len check (char_length(title) between 1 and 120),
  constraint subjects_description_len check (char_length(description) <= 600)
);
create index subjects_published_position_idx on public.subjects (is_published, position);
create index subjects_title_trgm_idx on public.subjects using gin (title extensions.gin_trgm_ops);
create trigger subjects_touch before update on public.subjects
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- units — belong to a subject
-- -----------------------------------------------------------------------------
create table public.units (
  id                 uuid primary key default gen_random_uuid(),
  subject_id         uuid not null references public.subjects (id) on delete cascade,
  number             integer not null default 1,      -- display number ("Unit 3"), editable
  position           integer not null default 0,      -- ordering inside the subject
  title              text not null,
  description        text not null default '',        -- short card description
  introduction       text not null default '',        -- overview intro (plain text, blank line = paragraph)
  objectives         text[] not null default '{}',    -- learning objectives
  key_concepts       text[] not null default '{}',    -- important concepts
  estimated_minutes  integer not null default 30,
  is_published       boolean not null default false,
  is_demo            boolean not null default false,
  created_by         uuid references public.profiles (id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint units_title_len check (char_length(title) between 1 and 160),
  constraint units_minutes_range check (estimated_minutes between 1 and 1440)
);
create index units_subject_position_idx on public.units (subject_id, position);
create index units_published_idx on public.units (subject_id) where is_published;
create index units_title_trgm_idx on public.units using gin (title extensions.gin_trgm_ops);
create trigger units_touch before update on public.units
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- topics — key topics inside a unit (also used to tag questions)
-- -----------------------------------------------------------------------------
create table public.topics (
  id           uuid primary key default gen_random_uuid(),
  unit_id      uuid not null references public.units (id) on delete cascade,
  title        text not null,
  description  text not null default '',
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint topics_title_len check (char_length(title) between 1 and 160)
);
create index topics_unit_position_idx on public.topics (unit_id, position);
create index topics_title_trgm_idx on public.topics using gin (title extensions.gin_trgm_ops);
create trigger topics_touch before update on public.topics
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- summaries — one rich-text summary per unit (draft or published)
-- -----------------------------------------------------------------------------
create table public.summaries (
  id            uuid primary key default gen_random_uuid(),
  unit_id       uuid not null unique references public.units (id) on delete cascade,
  content_html  text not null default '',            -- sanitised HTML produced by the editor
  status        public.content_status not null default 'draft',
  word_count    integer not null default 0,
  published_at  timestamptz,
  updated_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index summaries_status_idx on public.summaries (status);
create index summaries_fts_idx on public.summaries
  using gin (to_tsvector('simple', regexp_replace(content_html, '<[^>]+>', ' ', 'g')));
create trigger summaries_touch before update on public.summaries
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- learning_resources — files stored in the PRIVATE "resources" bucket
-- -----------------------------------------------------------------------------
create table public.learning_resources (
  id              uuid primary key default gen_random_uuid(),
  subject_id      uuid not null references public.subjects (id) on delete cascade,
  unit_id         uuid references public.units (id) on delete cascade,
  title           text not null,
  description     text not null default '',
  kind            public.resource_kind not null default 'pdf',
  storage_path    text not null unique,             -- object name inside the resources bucket
  file_name       text not null,
  mime_type       text not null default 'application/pdf',
  file_size       bigint not null default 0,
  allow_download  boolean not null default true,
  is_published    boolean not null default false,
  is_demo         boolean not null default false,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint resources_title_len check (char_length(title) between 1 and 160),
  constraint resources_size_nonneg check (file_size >= 0)
);
create index resources_subject_idx on public.learning_resources (subject_id);
create index resources_unit_idx on public.learning_resources (unit_id);
create index resources_title_trgm_idx on public.learning_resources using gin (title extensions.gin_trgm_ops);
create trigger resources_touch before update on public.learning_resources
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- Question bank (admin-only tables; students reach questions via RPC only)
-- -----------------------------------------------------------------------------
create table public.questions (
  id                uuid primary key default gen_random_uuid(),
  subject_id        uuid not null references public.subjects (id) on delete cascade,
  unit_id           uuid references public.units (id) on delete set null,
  topic_id          uuid references public.topics (id) on delete set null,
  type              public.question_type not null default 'multiple_choice',
  body              text not null,                  -- plain text; $...$ renders as inline maths
  explanation       text not null default '',
  accepted_answers  text[] not null default '{}',   -- short_answer only
  difficulty        public.difficulty_level not null default 'medium',
  is_demo           boolean not null default false,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint questions_body_len check (char_length(body) between 1 and 2000)
);
create index questions_subject_idx on public.questions (subject_id);
create index questions_unit_idx on public.questions (unit_id);
create index questions_topic_idx on public.questions (topic_id);
create index questions_difficulty_idx on public.questions (difficulty);
create index questions_body_trgm_idx on public.questions using gin (body extensions.gin_trgm_ops);
create trigger questions_touch before update on public.questions
  for each row execute function public.touch_updated_at();

create table public.question_options (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references public.questions (id) on delete cascade,
  body         text not null,
  is_correct   boolean not null default false,
  position     integer not null default 0,
  constraint question_options_body_len check (char_length(body) between 1 and 600)
);
create index question_options_question_idx on public.question_options (question_id, position);

-- -----------------------------------------------------------------------------
-- Quizzes (curated question lists) and exams (generated, timed question sets)
-- -----------------------------------------------------------------------------
create table public.quizzes (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  description         text not null default '',
  subject_id          uuid not null references public.subjects (id) on delete cascade,
  unit_id             uuid references public.units (id) on delete cascade,
  mode                public.quiz_mode not null default 'practice',
  time_limit_minutes  integer,
  pass_percentage     integer not null default 60,
  shuffle_questions   boolean not null default false,
  is_published        boolean not null default false,
  is_demo             boolean not null default false,
  created_by          uuid references public.profiles (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint quizzes_title_len check (char_length(title) between 1 and 160),
  constraint quizzes_time_limit check (time_limit_minutes is null or time_limit_minutes between 1 and 360),
  constraint quizzes_pass_range check (pass_percentage between 0 and 100)
);
create index quizzes_subject_idx on public.quizzes (subject_id);
create index quizzes_unit_idx on public.quizzes (unit_id);
create trigger quizzes_touch before update on public.quizzes
  for each row execute function public.touch_updated_at();

create table public.quiz_questions (
  quiz_id      uuid not null references public.quizzes (id) on delete cascade,
  question_id  uuid not null references public.questions (id) on delete cascade,
  position     integer not null default 0,
  primary key (quiz_id, question_id)
);
create index quiz_questions_question_idx on public.quiz_questions (question_id);

create table public.exams (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  description       text not null default '',
  kind              public.exam_kind not null default 'unit',
  subject_id        uuid references public.subjects (id) on delete cascade,
  question_count    integer not null default 20,
  duration_minutes  integer not null default 30,
  pass_percentage   integer not null default 50,
  is_published      boolean not null default false,
  is_demo           boolean not null default false,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint exams_title_len check (char_length(title) between 1 and 160),
  constraint exams_question_count check (question_count between 1 and 200),
  constraint exams_duration check (duration_minutes between 1 and 360),
  constraint exams_pass_range check (pass_percentage between 0 and 100)
);
create index exams_subject_idx on public.exams (subject_id);
create trigger exams_touch before update on public.exams
  for each row execute function public.touch_updated_at();

-- Units an exam draws from. Empty set => the whole subject.
create table public.exam_units (
  exam_id  uuid not null references public.exams (id) on delete cascade,
  unit_id  uuid not null references public.units (id) on delete cascade,
  primary key (exam_id, unit_id)
);
create index exam_units_unit_idx on public.exam_units (unit_id);

-- -----------------------------------------------------------------------------
-- Attempts — one table for quiz attempts AND exam attempts.
--   quiz_attempts / exam_attempts are exposed as views below.
-- -----------------------------------------------------------------------------
create table public.attempts (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  kind                public.attempt_kind not null,
  quiz_id             uuid references public.quizzes (id) on delete set null,
  exam_id             uuid references public.exams (id) on delete set null,
  title               text not null,                        -- snapshot, survives deletes
  subject_id          uuid references public.subjects (id) on delete set null,
  unit_id             uuid references public.units (id) on delete set null,
  mode                public.quiz_mode not null default 'practice',
  status              public.attempt_status not null default 'in_progress',
  question_ids        uuid[] not null default '{}',         -- ordered snapshot of this attempt's questions
  total_questions     integer not null default 0,
  time_limit_seconds  integer,
  started_at          timestamptz not null default now(),
  expires_at          timestamptz,                           -- authoritative deadline (server clock)
  submitted_at        timestamptz,
  timed_out           boolean not null default false,
  score               integer,                               -- number of correct answers
  percentage          numeric(5, 2),
  pass_percentage     integer not null default 60,
  passed              boolean,
  duration_seconds    integer,
  created_at          timestamptz not null default now(),
  constraint attempts_source check (
    (kind = 'quiz' and exam_id is null) or (kind = 'exam' and quiz_id is null)
  )
);
create index attempts_user_started_idx on public.attempts (user_id, started_at desc);
create index attempts_user_status_idx on public.attempts (user_id, status);
create index attempts_quiz_idx on public.attempts (quiz_id);
create index attempts_exam_idx on public.attempts (exam_id);
create index attempts_subject_idx on public.attempts (subject_id);

create view public.quiz_attempts with (security_invoker = on) as
  select * from public.attempts where kind = 'quiz';
create view public.exam_attempts with (security_invoker = on) as
  select * from public.attempts where kind = 'exam';

create table public.attempt_answers (
  id                   uuid primary key default gen_random_uuid(),
  attempt_id           uuid not null references public.attempts (id) on delete cascade,
  question_id          uuid not null references public.questions (id) on delete cascade,
  selected_option_ids  uuid[] not null default '{}',
  text_answer          text,
  is_correct           boolean,                -- NULL until graded / revealed
  checked              boolean not null default false,  -- practice mode: feedback already shown
  answered_at          timestamptz not null default now(),
  unique (attempt_id, question_id)
);
create index attempt_answers_question_idx on public.attempt_answers (question_id);

-- -----------------------------------------------------------------------------
-- Student progress, activity, bookmarks
-- -----------------------------------------------------------------------------
create table public.student_progress (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles (id) on delete cascade,
  unit_id           uuid not null references public.units (id) on delete cascade,
  subject_id        uuid not null references public.subjects (id) on delete cascade,
  status            public.progress_status not null default 'in_progress',
  reading_progress  smallint not null default 0,
  completed_at      timestamptz,
  last_accessed_at  timestamptz not null default now(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (user_id, unit_id),
  constraint progress_reading_range check (reading_progress between 0 and 100)
);
create index student_progress_user_accessed_idx on public.student_progress (user_id, last_accessed_at desc);
create index student_progress_subject_idx on public.student_progress (user_id, subject_id);
create trigger student_progress_touch before update on public.student_progress
  for each row execute function public.touch_updated_at();

create table public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  kind        public.activity_kind not null,
  subject_id  uuid references public.subjects (id) on delete cascade,
  unit_id     uuid references public.units (id) on delete cascade,
  ref_id      uuid,                                   -- attempt id / resource id
  title       text,
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index activity_user_created_idx on public.activity_log (user_id, created_at desc);
create index activity_kind_idx on public.activity_log (kind, created_at desc);

create table public.bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  unit_id     uuid not null references public.units (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, unit_id)
);
create index bookmarks_user_idx on public.bookmarks (user_id, created_at desc);

-- -----------------------------------------------------------------------------
-- Notifications. user_id NULL => broadcast to every student.
-- Read state is per user in notification_reads.
-- -----------------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles (id) on delete cascade,
  kind        public.notification_kind not null default 'announcement',
  title       text not null,
  body        text not null default '',
  link        text,
  created_by  uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint notifications_title_len check (char_length(title) between 1 and 160),
  constraint notifications_body_len check (char_length(body) <= 1000),
  constraint notifications_link_internal check (link is null or link ~ '^/[^/]')
);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_created_idx on public.notifications (created_at desc);

create table public.notification_reads (
  user_id          uuid not null references public.profiles (id) on delete cascade,
  notification_id  uuid not null references public.notifications (id) on delete cascade,
  read_at          timestamptz not null default now(),
  primary key (user_id, notification_id)
);
