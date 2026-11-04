# Zetora database schema

Source of truth: [`supabase/migrations`](../supabase/migrations). Three migrations, applied in order:

1. `…0001_schema.sql` — enums, tables, constraints, indexes, `updated_at` triggers
2. `…0002_security.sql` — helper functions, triggers, **Row Level Security**, grants, storage buckets + policies
3. `…0003_functions.sql` — RPCs: student read-models, search, notifications, the quiz/exam engine, admin helpers

## Entity overview

```
auth.users 1─1 profiles ──< attempts ──< attempt_answers >── questions ──< question_options
                  │             │                              │  │
                  │             ├── quiz_id ──> quizzes ──< quiz_questions >─┘  │
                  │             └── exam_id ──> exams  ──< exam_units >── units │
                  ├──< student_progress >── units >── subjects                 │
                  ├──< bookmarks >── units                          topics ─────┘ (questions.topic_id)
                  ├──< activity_log
                  └──< notification_reads >── notifications (user_id NULL = broadcast)

subjects ──< units ──< topics
                 ├──1─1 summaries            (draft | published rich-text HTML)
                 └──< learning_resources     (file in the PRIVATE `resources` bucket)
```

| Table | Purpose | Notable columns / constraints |
| --- | --- | --- |
| `profiles` | One row per user (created by a trigger on `auth.users`) | `role` (`student`/`admin`), `is_active`, optional `school`, `location`, `avatar_url`, `locale` |
| `subjects` | Catalogue entries | `slug` unique + format check, `icon`/`color` keys, `position`, `is_published`, `is_demo` |
| `units` | Belong to a subject | `number` (display), `position` (order), `objectives[]`, `key_concepts[]`, `estimated_minutes` |
| `topics` | Key topics of a unit; also tag questions | ordered by `position` |
| `summaries` | One per unit (`unit_id` unique) | `content_html` (sanitised), `status`, `word_count`, `published_at`; GIN full-text index |
| `learning_resources` | PDFs/notes/images | `storage_path` unique, `mime_type`, `file_size`, `allow_download`, `is_published` |
| `questions` | Question bank (admin-only) | `type`, `difficulty`, `explanation`, `accepted_answers[]` (short answer), optional `unit_id`/`topic_id` |
| `question_options` | Answer options (admin-only) | `is_correct`, `position` |
| `quizzes` / `quiz_questions` | Curated question lists | `mode` (`practice`/`exam`), `time_limit_minutes`, `pass_percentage`, `shuffle_questions` |
| `exams` / `exam_units` | Generated, timed question sets | `kind` (`unit`/`subject`/`mixed`/`mock`), `question_count`, `duration_minutes`; empty `exam_units` ⇒ whole subject |
| `attempts` | **Quiz and exam attempts** (views `quiz_attempts`, `exam_attempts` filter by kind) | `question_ids[]` ordered snapshot, `expires_at` (authoritative deadline), `score`, `percentage`, `passed`, `timed_out`, `duration_seconds`; title/subject/unit snapshots survive deletes |
| `attempt_answers` | Per-question answers | `selected_option_ids[]`, `text_answer`, `is_correct` (NULL until revealed/graded), `checked` (practice feedback shown) |
| `student_progress` | Unit status per student | unique `(user_id, unit_id)`, `reading_progress` 0–100, `status`; `subject_id` is derived by trigger |
| `activity_log` | Study history | unit opened, summary read, unit completed, resource opened, quiz/exam completed |
| `bookmarks` | Saved units | unique `(user_id, unit_id)` |
| `notifications` / `notification_reads` | In-app notifications | `user_id NULL` = broadcast to everyone; read state per user; internal-only `link` constraint |

Indexes cover every foreign key plus the hot paths (`attempts(user_id, started_at desc)`, `activity_log(user_id, created_at desc)`,
trigram indexes for admin search, a GIN full-text index on summaries).

Content-publication triggers insert broadcast notifications (new subject / material / quiz / exam). Seed scripts silence them with
`select set_config('app.skip_notifications','on',true)`.

## Row Level Security

Helper functions (`SECURITY DEFINER`, pinned `search_path`): `is_admin()`, `subject_is_visible()`, `unit_is_visible()`.

| Data | anon | student | admin |
| --- | --- | --- | --- |
| `subjects` | read **published** (landing page) | read published | all |
| `units`, `topics`, `summaries`, `learning_resources`, `quizzes`, `exams` (+ link tables) | — | read **published** (and parents published) | all |
| `questions`, `question_options` | — | **no access** (reach questions only via RPC) | all |
| `profiles` | — | own row; may edit own name/school/location/avatar (trigger blocks `role`, `is_active`, `email`) | all |
| `attempts`, `attempt_answers` | — | **read own only**; no INSERT/UPDATE/DELETE privilege | read all |
| `student_progress`, `activity_log`, `bookmarks` | — | own rows (progress/bookmarks only for visible units) | read all |
| `notifications` | — | broadcast + own | all |
| `notification_reads` | — | own | — |

### Storage

| Bucket | Visibility | Limits | Policies |
| --- | --- | --- | --- |
| `resources` | **private** | 25 MB; `application/pdf`, PNG, JPEG, WebP, `text/plain` | admins: all; students: `SELECT` only when a *published* `learning_resources` row (with published unit/subject) points at the object |
| `media` | public | 5 MB images | admins: all; users: write only inside `avatars/<their uid>/` |

## RPC reference (`supabase.rpc(...)`)

**Student** — `get_subject_cards()` (also anon), `get_subject_units(subject)`, `get_student_stats()`, `get_recommendations(limit)`,
`get_subject_performance()`, `get_topic_performance()`, `get_activity_by_day(days)`, `search_content(q, limit)`,
`get_notifications(limit)`, `unread_notification_count()`, `mark_all_notifications_read()`.

**Quiz & exam engine** — `start_quiz_attempt(quiz)`, `start_exam_attempt(exam)` (resume an unfinished, unexpired attempt),
`get_attempt(id)` (never returns correctness; auto-submits if expired), `save_attempt_answer(...)`, `check_attempt_answer(...)`
(practice mode only), `submit_attempt(id, answers)` (idempotent), `get_attempt_result(id)` (submitted attempts only),
`finalize_my_expired_attempts()`. Internal: `grade_answer`, `finalize_attempt`, `clean_selection`, `question_is_gradable` (not executable by API roles).

**Admin** — `admin_overview()`, `admin_analytics(days)`, `admin_students(search, limit, offset)`, `admin_save_question(json)` (atomic,
keeps option ids), `admin_set_quiz_questions`, `admin_set_exam_units`, `admin_set_positions(table, ids)`, `admin_delete_demo_content()`.
All call `require_admin()` first.

### Grading rules

- Multiple choice / true-false: the single selected option must be the correct one.
- Multiple select: the selected set must equal the correct set exactly.
- Short answer: case-insensitive, whitespace-normalised match against `accepted_answers`.
- Each question is worth one point; `percentage = round(100 * score / total_questions, 2)`; `passed = percentage >= pass_percentage`.
- Unanswered questions score zero.

### Timing rules

`expires_at = started_at + time limit`. `save_attempt_answer` accepts writes until `expires_at + 15 s` (network grace) and then raises
`ZT001`. Opening or listing an expired in-progress attempt grades it as `timed_out`; a late manual submit is graded on the answers saved before the deadline.
