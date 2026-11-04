-- =============================================================================
-- Zetora — RPC functions
--
--  * Student read models (stats, recommendations, search, notifications)
--  * The quiz / exam engine: start, autosave, practice feedback, submit, review
--  * Admin helpers (overview, analytics, atomic question save, reorder, ...)
--
-- Every SECURITY DEFINER function pins search_path and re-checks auth.uid() /
-- is_admin() itself. Internal helpers are not executable by API roles.
-- =============================================================================

create or replace function public.require_user()
returns uuid
language plpgsql
stable
as $$
declare uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'You need to be signed in' using errcode = '28000';
  end if;
  return uid;
end;
$$;

create or replace function public.require_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare uid uuid := auth.uid();
begin
  if uid is null or not public.is_admin() then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  return uid;
end;
$$;

-- Never leave the platform without an active administrator.
create or replace function public.ensure_admin_remains()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.role = 'admin' and old.is_active and (new.role <> 'admin' or not new.is_active) then
    if not exists (
      select 1 from public.profiles p where p.role = 'admin' and p.is_active and p.id <> old.id
    ) then
      raise exception 'At least one active administrator is required' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_keep_one_admin before update on public.profiles
  for each row execute function public.ensure_admin_remains();

-- =============================================================================
-- STUDENT READ MODELS
-- =============================================================================

-- Subject cards. Callable by anon (landing page) and students. Aggregates only.
create or replace function public.get_subject_cards()
returns table (
  id uuid, slug text, title text, description text, icon text, color text,
  image_url text, "position" integer,
  unit_count integer, summary_count integer, resource_count integer,
  quiz_count integer, completed_units integer
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id, s.slug, s.title, s.description, s.icon, s.color, s.image_url, s.position,
    (select count(*)::int from public.units u
       where u.subject_id = s.id and u.is_published),
    (select count(*)::int from public.summaries sm
       join public.units u on u.id = sm.unit_id
       where u.subject_id = s.id and u.is_published and sm.status = 'published'),
    (select count(*)::int from public.learning_resources r
       where r.subject_id = s.id and r.is_published
         and (r.unit_id is null or exists (
           select 1 from public.units u where u.id = r.unit_id and u.is_published))),
    (select count(*)::int from public.quizzes q
       where q.subject_id = s.id and q.is_published
         and (q.unit_id is null or exists (
           select 1 from public.units u where u.id = q.unit_id and u.is_published))),
    (select count(*)::int from public.student_progress p
       join public.units u on u.id = p.unit_id
       where p.user_id = auth.uid() and p.subject_id = s.id
         and p.status = 'completed' and u.is_published)
  from public.subjects s
  where s.is_published
  order by s.position, s.title;
$$;

-- Units of a subject with availability + the caller's progress.
create or replace function public.get_subject_units(p_subject_id uuid)
returns table (
  id uuid, subject_id uuid, number integer, "position" integer, title text, description text,
  estimated_minutes integer, has_summary boolean, resource_count integer, quiz_count integer,
  status text, reading_progress integer, best_percentage numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id, u.subject_id, u.number, u.position, u.title, u.description, u.estimated_minutes,
    exists (select 1 from public.summaries sm where sm.unit_id = u.id and sm.status = 'published'),
    (select count(*)::int from public.learning_resources r where r.unit_id = u.id and r.is_published),
    (select count(*)::int from public.quizzes q where q.unit_id = u.id and q.is_published),
    coalesce(p.status::text, 'not_started'),
    coalesce(p.reading_progress, 0)::int,
    (select max(a.percentage) from public.attempts a
       where a.user_id = auth.uid() and a.unit_id = u.id and a.kind = 'quiz' and a.status = 'submitted')
  from public.units u
  join public.subjects s on s.id = u.subject_id and s.is_published
  left join public.student_progress p on p.unit_id = u.id and p.user_id = auth.uid()
  where u.subject_id = p_subject_id and u.is_published
  order by u.position, u.number, u.created_at;
$$;

-- Headline numbers for the dashboard / progress page.
create or replace function public.get_student_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  uid uuid := public.require_user();
  tz constant text := 'Africa/Addis_Ababa';
  v_today date := (now() at time zone tz)::date;
  v_total int; v_completed int; v_in_progress int;
  v_quizzes int; v_exams int; v_avg_quiz numeric; v_avg_exam numeric;
  v_streak int; v_active_days int; v_today_counts jsonb;
begin
  select count(*) into v_total
    from public.units u join public.subjects s on s.id = u.subject_id
    where u.is_published and s.is_published;

  select count(*) filter (where p.status = 'completed'),
         count(*) filter (where p.status = 'in_progress')
    into v_completed, v_in_progress
    from public.student_progress p
    where p.user_id = uid and public.unit_is_visible(p.unit_id);

  select count(*) filter (where kind = 'quiz'), count(*) filter (where kind = 'exam'),
         round(avg(percentage) filter (where kind = 'quiz'), 1),
         round(avg(percentage) filter (where kind = 'exam'), 1)
    into v_quizzes, v_exams, v_avg_quiz, v_avg_exam
    from public.attempts where user_id = uid and status = 'submitted';

  with days as (
    select distinct (created_at at time zone tz)::date as d from public.activity_log where user_id = uid
  ), islands as (
    select d, d - (row_number() over (order by d))::int as grp from days
  ), grouped as (
    select count(*)::int as len, max(d) as last_day from islands group by grp
  )
  select coalesce(max(len) filter (where last_day >= v_today - 1), 0) into v_streak from grouped;

  select count(distinct (created_at at time zone tz)::date) into v_active_days
    from public.activity_log
    where user_id = uid and created_at >= now() - interval '30 days';

  select coalesce(jsonb_object_agg(kind, c), '{}'::jsonb) into v_today_counts
  from (
    select kind::text as kind, count(*) as c from public.activity_log
    where user_id = uid and (created_at at time zone tz)::date = v_today
    group by kind
  ) t;

  return jsonb_build_object(
    'total_units', v_total,
    'completed_units', v_completed,
    'in_progress_units', v_in_progress,
    'quizzes_completed', v_quizzes,
    'exams_completed', v_exams,
    'avg_quiz_score', v_avg_quiz,
    'avg_exam_score', v_avg_exam,
    'study_streak', v_streak,
    'active_days_30', v_active_days,
    'today', v_today_counts
  );
end;
$$;

-- Next best things to study, derived from real progress and quiz results.
create or replace function public.get_recommendations(p_limit integer default 4)
returns table (
  unit_id uuid, unit_number integer, unit_title text, estimated_minutes integer,
  subject_id uuid, subject_slug text, subject_title text, subject_color text, subject_icon text,
  reason text, reading_progress integer, best_percentage numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with vu as (
    select u.id as unit_id, u.number, u.title, u.position, u.estimated_minutes,
           s.id as subject_id, s.slug, s.title as subject_title, s.color, s.icon, s.position as s_pos
    from public.units u join public.subjects s on s.id = u.subject_id
    where u.is_published and s.is_published
  ),
  prog as (
    select unit_id, status, reading_progress, last_accessed_at
    from public.student_progress where user_id = auth.uid()
  ),
  best as (
    select unit_id, max(percentage) as pct
    from public.attempts
    where user_id = auth.uid() and status = 'submitted' and kind = 'quiz' and unit_id is not null
    group by unit_id
  ),
  cand as (
    select vu.*, 'resume'::text as reason, 1 as prio, prog.last_accessed_at as seen,
           prog.reading_progress as rp, best.pct
    from vu join prog on prog.unit_id = vu.unit_id and prog.status = 'in_progress'
    left join best on best.unit_id = vu.unit_id
    union all
    select * from (
      select distinct on (vu.subject_id) vu.*, 'next'::text, 2,
             (select max(p2.last_accessed_at) from prog p2 join vu v2 on v2.unit_id = p2.unit_id
                where v2.subject_id = vu.subject_id) as seen,
             0, null::numeric
      from vu left join prog on prog.unit_id = vu.unit_id
      where prog.unit_id is null
      order by vu.subject_id, vu.position, vu.number
    ) nxt
    union all
    select vu.*, 'review'::text, 3, prog.last_accessed_at, coalesce(prog.reading_progress, 0), best.pct
    from vu join best on best.unit_id = vu.unit_id and best.pct < 60
    left join prog on prog.unit_id = vu.unit_id
  ),
  dedup as (
    select distinct on (unit_id) * from cand order by unit_id, prio
  )
  select unit_id, number, title, estimated_minutes,
         subject_id, slug, subject_title, color, icon,
         reason, coalesce(rp, 0)::int, pct
  from dedup
  order by prio, seen desc nulls last, s_pos
  limit greatest(p_limit, 1);
$$;

create or replace function public.get_subject_performance()
returns table (
  subject_id uuid, slug text, title text, color text,
  attempts integer, avg_percentage numeric, best_percentage numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.slug, s.title, s.color,
         count(*)::int, round(avg(a.percentage), 1), max(a.percentage)
  from public.attempts a
  join public.subjects s on s.id = a.subject_id
  where a.user_id = auth.uid() and a.status = 'submitted'
  group by s.id, s.slug, s.title, s.color, s.position
  order by s.position, s.title;
$$;

-- Accuracy per topic (or per unit when questions are not tagged with a topic).
create or replace function public.get_topic_performance()
returns table (
  area_id uuid, area_type text, area_title text,
  subject_id uuid, subject_title text, subject_color text,
  answered integer, correct integer, accuracy numeric
)
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(t.id, u.id),
         case when t.id is not null then 'topic' else 'unit' end,
         coalesce(t.title, u.title),
         s.id, s.title, s.color,
         count(*)::int,
         (count(*) filter (where aa.is_correct))::int,
         round(100.0 * count(*) filter (where aa.is_correct) / count(*), 1)
  from public.attempt_answers aa
  join public.attempts a on a.id = aa.attempt_id
  join public.questions q on q.id = aa.question_id
  join public.subjects s on s.id = q.subject_id
  left join public.topics t on t.id = q.topic_id
  left join public.units u on u.id = q.unit_id
  where a.user_id = auth.uid() and a.status = 'submitted'
    and aa.is_correct is not null
    and (t.id is not null or u.id is not null)
  group by coalesce(t.id, u.id),
           case when t.id is not null then 'topic' else 'unit' end,
           coalesce(t.title, u.title), s.id, s.title, s.color;
$$;

create or replace function public.get_activity_by_day(p_days integer default 14)
returns table (day date, activities integer, quizzes integer)
language sql
stable
security definer
set search_path = public
as $$
  with days as (
    select generate_series(
      ((now() at time zone 'Africa/Addis_Ababa')::date - (greatest(p_days, 1) - 1)),
      (now() at time zone 'Africa/Addis_Ababa')::date,
      interval '1 day')::date as d
  )
  select days.d,
         (count(l.id))::int,
         (count(l.id) filter (where l.kind in ('quiz_completed', 'exam_completed')))::int
  from days
  left join public.activity_log l
    on l.user_id = auth.uid()
   and (l.created_at at time zone 'Africa/Addis_Ababa')::date = days.d
  group by days.d
  order by days.d;
$$;

-- -----------------------------------------------------------------------------
-- Search across subjects, units, topics, summaries and learning materials.
-- Highlights are returned as [[match]] markers; the UI renders them safely.
-- -----------------------------------------------------------------------------
create or replace function public.search_content(p_query text, p_limit integer default 24)
returns table (
  kind text, id uuid, title text, snippet text,
  subject_slug text, subject_title text,
  unit_id uuid, unit_number integer, unit_title text, rank real
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  q text := left(trim(coalesce(p_query, '')), 80);
  pat text;
  tsq tsquery;
  lim integer := least(greatest(coalesce(p_limit, 24), 1), 60);
begin
  perform public.require_user();
  if char_length(q) < 2 then
    return;
  end if;
  pat := '%' || replace(replace(replace(q, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  tsq := websearch_to_tsquery('simple', q);

  return query
  select * from (
    (select 'subject'::text, s.id, s.title, s.description,
            s.slug, s.title, null::uuid, null::integer, null::text,
            (case when s.title ilike pat then 1.0 else 0.4 end)::real
     from public.subjects s
     where s.is_published and (s.title ilike pat or s.description ilike pat)
     limit lim)
    union all
    (select 'unit'::text, u.id, u.title, u.description,
            s.slug, s.title, u.id, u.number, u.title,
            (case when u.title ilike pat then 0.9 else 0.4 end)::real
     from public.units u join public.subjects s on s.id = u.subject_id
     where u.is_published and s.is_published and (u.title ilike pat or u.description ilike pat)
     limit lim)
    union all
    (select 'topic'::text, t.id, t.title, t.description,
            s.slug, s.title, u.id, u.number, u.title, 0.8::real
     from public.topics t
     join public.units u on u.id = t.unit_id
     join public.subjects s on s.id = u.subject_id
     where u.is_published and s.is_published and t.title ilike pat
     limit lim)
    union all
    (select 'summary'::text, sm.id, u.title || ' — summary',
            ts_headline('simple', regexp_replace(sm.content_html, '<[^>]+>', ' ', 'g'), tsq,
                        'StartSel=[[, StopSel=]], MaxFragments=1, MaxWords=26, MinWords=10'),
            s.slug, s.title, u.id, u.number, u.title,
            ts_rank(to_tsvector('simple', regexp_replace(sm.content_html, '<[^>]+>', ' ', 'g')), tsq)
     from public.summaries sm
     join public.units u on u.id = sm.unit_id
     join public.subjects s on s.id = u.subject_id
     where sm.status = 'published' and u.is_published and s.is_published
       and to_tsvector('simple', regexp_replace(sm.content_html, '<[^>]+>', ' ', 'g')) @@ tsq
     limit lim)
    union all
    (select 'resource'::text, r.id, r.title, r.description,
            s.slug, s.title, u.id, u.number, u.title, 0.7::real
     from public.learning_resources r
     join public.subjects s on s.id = r.subject_id
     left join public.units u on u.id = r.unit_id
     where r.is_published and s.is_published and (r.unit_id is null or u.is_published)
       and (r.title ilike pat or r.description ilike pat)
     limit lim)
  ) results
  order by 10 desc, 3
  limit lim;
end;
$$;

-- -----------------------------------------------------------------------------
-- Notifications
-- -----------------------------------------------------------------------------
create or replace function public.get_notifications(p_limit integer default 30)
returns table (
  id uuid, kind public.notification_kind, title text, body text, link text,
  created_at timestamptz, is_read boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select n.id, n.kind, n.title, n.body, n.link, n.created_at,
         exists (select 1 from public.notification_reads r
                 where r.notification_id = n.id and r.user_id = auth.uid())
  from public.notifications n
  where (n.user_id is null or n.user_id = auth.uid())
    and n.created_at >= (
      select greatest(p.created_at - interval '30 days', now() - interval '90 days')
      from public.profiles p where p.id = auth.uid())
  order by n.created_at desc
  limit least(greatest(p_limit, 1), 100);
$$;

create or replace function public.unread_notification_count()
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::int
  from public.notifications n
  where (n.user_id is null or n.user_id = auth.uid())
    and n.created_at >= (
      select greatest(p.created_at - interval '30 days', now() - interval '90 days')
      from public.profiles p where p.id = auth.uid())
    and not exists (select 1 from public.notification_reads r
                    where r.notification_id = n.id and r.user_id = auth.uid());
$$;

create or replace function public.mark_all_notifications_read()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare uid uuid := public.require_user();
begin
  insert into public.notification_reads (user_id, notification_id)
  select uid, n.id from public.notifications n
  where (n.user_id is null or n.user_id = uid)
    and n.created_at >= now() - interval '90 days'
  on conflict do nothing;
end;
$$;

-- =============================================================================
-- QUIZ / EXAM ENGINE
-- =============================================================================

create or replace function public.normalize_answer(t text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(trim(coalesce(t, '')), '\s+', ' ', 'g'));
$$;

-- A question can be served only when it can actually be graded.
create or replace function public.question_is_gradable(p_question_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.questions q
    where q.id = p_question_id
      and (
        (q.type = 'short_answer' and cardinality(q.accepted_answers) > 0)
        or (q.type <> 'short_answer' and exists (
              select 1 from public.question_options o where o.question_id = q.id and o.is_correct))
      )
  );
$$;

create or replace function public.grade_answer(p_question_id uuid, p_option_ids uuid[], p_text text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  q record;
  v_correct uuid[];
  v_selected uuid[];
begin
  select type, accepted_answers into q from public.questions where id = p_question_id;
  if not found then
    return false;
  end if;

  if q.type = 'short_answer' then
    return public.normalize_answer(p_text) <> ''
       and exists (
         select 1 from unnest(q.accepted_answers) a
         where public.normalize_answer(a) = public.normalize_answer(p_text));
  end if;

  select coalesce(array_agg(id order by id), '{}') into v_correct
    from public.question_options where question_id = p_question_id and is_correct;
  select coalesce(array_agg(distinct x order by x), '{}') into v_selected
    from unnest(coalesce(p_option_ids, '{}')) x;

  return cardinality(v_correct) > 0 and v_selected = v_correct;
end;
$$;

-- Keep only option ids that really belong to the question (and 1 for single-answer types).
create or replace function public.clean_selection(p_question_id uuid, p_option_ids uuid[])
returns uuid[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_type public.question_type;
  v_ids uuid[];
begin
  select type into v_type from public.questions where id = p_question_id;
  select coalesce(array_agg(o.id), '{}') into v_ids
    from public.question_options o
    where o.question_id = p_question_id and o.id = any(coalesce(p_option_ids, '{}'));
  if v_type in ('multiple_choice', 'true_false') and cardinality(v_ids) > 1 then
    v_ids := array[v_ids[1]];
  end if;
  return v_ids;
end;
$$;

create or replace function public.start_quiz_attempt(p_quiz_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.require_user();
  qz public.quizzes%rowtype;
  v_existing uuid;
  v_ids uuid[];
  v_id uuid;
begin
  select * into qz from public.quizzes q
   where q.id = p_quiz_id and q.is_published
     and public.subject_is_visible(q.subject_id)
     and (q.unit_id is null or public.unit_is_visible(q.unit_id));
  if not found then
    raise exception 'This quiz is not available' using errcode = 'P0002';
  end if;

  -- Resume an unfinished, unexpired attempt instead of starting a new one.
  select a.id into v_existing from public.attempts a
   where a.user_id = uid and a.quiz_id = p_quiz_id and a.status = 'in_progress'
     and (a.expires_at is null or a.expires_at > now())
   order by a.started_at desc limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  select array_agg(x.question_id order by x.sort_key) into v_ids from (
    select qq.question_id,
           case when qz.shuffle_questions then random() else qq.position::float8 end as sort_key
    from public.quiz_questions qq
    where qq.quiz_id = p_quiz_id and public.question_is_gradable(qq.question_id)
  ) x;
  if v_ids is null then
    raise exception 'This quiz has no questions yet' using errcode = 'P0001';
  end if;

  insert into public.attempts (
    user_id, kind, quiz_id, title, subject_id, unit_id, mode, question_ids, total_questions,
    time_limit_seconds, started_at, expires_at, pass_percentage
  ) values (
    uid, 'quiz', qz.id, qz.title, qz.subject_id, qz.unit_id, qz.mode, v_ids, cardinality(v_ids),
    qz.time_limit_minutes * 60, now(),
    case when qz.time_limit_minutes is not null then now() + make_interval(mins => qz.time_limit_minutes) end,
    qz.pass_percentage
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.start_exam_attempt(p_exam_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.require_user();
  ex public.exams%rowtype;
  v_existing uuid;
  v_ids uuid[];
  v_has_units boolean;
  v_unit uuid;
  v_id uuid;
begin
  select * into ex from public.exams e
   where e.id = p_exam_id and e.is_published
     and (e.subject_id is null or public.subject_is_visible(e.subject_id));
  if not found then
    raise exception 'This exam is not available' using errcode = 'P0002';
  end if;

  select a.id into v_existing from public.attempts a
   where a.user_id = uid and a.exam_id = p_exam_id and a.status = 'in_progress'
     and (a.expires_at is null or a.expires_at > now())
   order by a.started_at desc limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  select exists (select 1 from public.exam_units eu where eu.exam_id = ex.id) into v_has_units;

  select array_agg(x.id order by x.r) into v_ids from (
    select q.id, random() as r
    from public.questions q
    where public.question_is_gradable(q.id)
      and (q.unit_id is null or public.unit_is_visible(q.unit_id))
      and (
        (v_has_units and q.unit_id in (select eu.unit_id from public.exam_units eu where eu.exam_id = ex.id))
        or (not v_has_units and q.subject_id = ex.subject_id)
      )
    order by random()
    limit ex.question_count
  ) x;
  if v_ids is null then
    raise exception 'This exam has no questions yet' using errcode = 'P0001';
  end if;

  if v_has_units then
    select eu.unit_id into v_unit from public.exam_units eu where eu.exam_id = ex.id
      having count(*) = 1;
  end if;

  insert into public.attempts (
    user_id, kind, exam_id, title, subject_id, unit_id, mode, question_ids, total_questions,
    time_limit_seconds, started_at, expires_at, pass_percentage
  ) values (
    uid, 'exam', ex.id, ex.title, ex.subject_id, v_unit, 'exam', v_ids, cardinality(v_ids),
    ex.duration_minutes * 60, now(), now() + make_interval(mins => ex.duration_minutes),
    ex.pass_percentage
  ) returning id into v_id;
  return v_id;
end;
$$;

-- Grades an attempt exactly once. Internal: not executable by API roles.
create or replace function public.finalize_attempt(p_attempt_id uuid, p_timed_out boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.attempts%rowtype;
  v_score integer;
  v_total integer;
  v_pct numeric;
  v_seconds integer;
begin
  select * into a from public.attempts where id = p_attempt_id for update;
  if not found or a.status = 'submitted' then
    return;
  end if;

  insert into public.attempt_answers (attempt_id, question_id)
  select a.id, qid from unnest(a.question_ids) as qid
  on conflict (attempt_id, question_id) do nothing;

  update public.attempt_answers aa
     set is_correct = public.grade_answer(aa.question_id, aa.selected_option_ids, aa.text_answer)
   where aa.attempt_id = a.id;

  select count(*) filter (where is_correct) into v_score
    from public.attempt_answers where attempt_id = a.id;
  v_total := greatest(a.total_questions, 1);
  v_pct := round(100.0 * v_score / v_total, 2);

  v_seconds := extract(epoch from (now() - a.started_at))::int;
  if a.time_limit_seconds is not null then
    v_seconds := least(v_seconds, a.time_limit_seconds);
  end if;

  update public.attempts set
    status = 'submitted',
    submitted_at = now(),
    timed_out = p_timed_out,
    score = v_score,
    percentage = v_pct,
    passed = v_pct >= a.pass_percentage,
    duration_seconds = greatest(v_seconds, 0)
  where id = a.id;

  insert into public.activity_log (user_id, kind, subject_id, unit_id, ref_id, title, meta)
  values (
    a.user_id,
    case a.kind when 'quiz' then 'quiz_completed'::public.activity_kind else 'exam_completed'::public.activity_kind end,
    a.subject_id, a.unit_id, a.id, a.title,
    jsonb_build_object('percentage', v_pct, 'score', v_score, 'total', a.total_questions,
                       'passed', v_pct >= a.pass_percentage, 'timed_out', p_timed_out)
  );
end;
$$;

-- Attempt payload for the runner. NEVER includes correctness — except feedback
-- for answers a student already checked in practice mode.
create or replace function public.get_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.require_user();
  a public.attempts%rowtype;
begin
  select * into a from public.attempts where id = p_attempt_id and user_id = uid;
  if not found then
    raise exception 'Attempt not found' using errcode = 'P0002';
  end if;

  -- The deadline is enforced here too, so refreshing can never extend the exam.
  if a.status = 'in_progress' and a.expires_at is not null and now() > a.expires_at then
    perform public.finalize_attempt(a.id, true);
    select * into a from public.attempts where id = p_attempt_id;
  end if;

  return jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', a.id, 'kind', a.kind, 'title', a.title, 'mode', a.mode, 'status', a.status,
      'started_at', a.started_at, 'expires_at', a.expires_at,
      'time_limit_seconds', a.time_limit_seconds, 'total_questions', a.total_questions,
      'quiz_id', a.quiz_id, 'exam_id', a.exam_id, 'subject_id', a.subject_id, 'unit_id', a.unit_id
    ),
    'server_now', now(),
    'questions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', q.id, 'type', q.type, 'body', q.body,
        'options', (
          select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'body', o.body) order by o.position), '[]'::jsonb)
          from public.question_options o where o.question_id = q.id)
      ) order by ord.n), '[]'::jsonb)
      from unnest(a.question_ids) with ordinality as ord(qid, n)
      join public.questions q on q.id = ord.qid
    ),
    'answers', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'question_id', aa.question_id,
        'selected_option_ids', aa.selected_option_ids,
        'text_answer', aa.text_answer,
        'checked', aa.checked,
        'is_correct', case when aa.checked then aa.is_correct end,
        'correct_option_ids', case when aa.checked then (
            select coalesce(jsonb_agg(o.id), '[]'::jsonb) from public.question_options o
            where o.question_id = aa.question_id and o.is_correct) end,
        'accepted_answers', case when aa.checked then (
            select to_jsonb(q2.accepted_answers) from public.questions q2
            where q2.id = aa.question_id and q2.type = 'short_answer') end,
        'explanation', case when aa.checked then (
            select q3.explanation from public.questions q3 where q3.id = aa.question_id) end
      )), '[]'::jsonb)
      from public.attempt_answers aa where aa.attempt_id = a.id
    )
  );
end;
$$;

create or replace function public.save_attempt_answer(
  p_attempt_id uuid, p_question_id uuid,
  p_option_ids uuid[] default '{}', p_text text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.require_user();
  a public.attempts%rowtype;
  grace constant interval := interval '15 seconds';
begin
  select * into a from public.attempts where id = p_attempt_id and user_id = uid;
  if not found then
    raise exception 'Attempt not found' using errcode = 'P0002';
  end if;
  if a.status <> 'in_progress' then
    raise exception 'This attempt has already been submitted' using errcode = 'ZT002';
  end if;
  if a.expires_at is not null and now() > a.expires_at + grace then
    raise exception 'Time is up' using errcode = 'ZT001';
  end if;
  if not (p_question_id = any (a.question_ids)) then
    raise exception 'Question is not part of this attempt' using errcode = 'P0002';
  end if;

  insert into public.attempt_answers (attempt_id, question_id, selected_option_ids, text_answer, answered_at)
  values (p_attempt_id, p_question_id, public.clean_selection(p_question_id, p_option_ids),
          left(p_text, 500), now())
  on conflict (attempt_id, question_id) do update
    set selected_option_ids = excluded.selected_option_ids,
        text_answer = excluded.text_answer,
        answered_at = now()
    where public.attempt_answers.checked = false;
end;
$$;

-- Practice mode only: record the answer, reveal correctness + explanation.
create or replace function public.check_attempt_answer(
  p_attempt_id uuid, p_question_id uuid,
  p_option_ids uuid[] default '{}', p_text text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.require_user();
  a public.attempts%rowtype;
  v_correct boolean;
  v_row public.attempt_answers%rowtype;
begin
  select * into a from public.attempts where id = p_attempt_id and user_id = uid;
  if not found then
    raise exception 'Attempt not found' using errcode = 'P0002';
  end if;
  if a.mode <> 'practice' then
    raise exception 'Answers are revealed after you submit' using errcode = '42501';
  end if;

  perform public.save_attempt_answer(p_attempt_id, p_question_id, p_option_ids, p_text);

  select * into v_row from public.attempt_answers
   where attempt_id = p_attempt_id and question_id = p_question_id;
  v_correct := public.grade_answer(p_question_id, v_row.selected_option_ids, v_row.text_answer);

  update public.attempt_answers set is_correct = v_correct, checked = true
   where id = v_row.id;

  return jsonb_build_object(
    'question_id', p_question_id,
    'selected_option_ids', v_row.selected_option_ids,
    'text_answer', v_row.text_answer,
    'checked', true,
    'is_correct', v_correct,
    'correct_option_ids', (select coalesce(jsonb_agg(o.id), '[]'::jsonb)
                           from public.question_options o where o.question_id = p_question_id and o.is_correct),
    'accepted_answers', (select to_jsonb(q.accepted_answers) from public.questions q
                         where q.id = p_question_id and q.type = 'short_answer'),
    'explanation', (select q.explanation from public.questions q where q.id = p_question_id)
  );
end;
$$;

-- Submit (idempotent). p_answers optionally flushes the final client state:
--   [{ "question_id": "...", "option_ids": ["..."], "text": "..." }]
create or replace function public.submit_attempt(p_attempt_id uuid, p_answers jsonb default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.require_user();
  a public.attempts%rowtype;
  r record;
  grace constant interval := interval '15 seconds';
  v_late boolean;
begin
  select * into a from public.attempts where id = p_attempt_id and user_id = uid for update;
  if not found then
    raise exception 'Attempt not found' using errcode = 'P0002';
  end if;

  if a.status = 'in_progress' then
    v_late := a.expires_at is not null and now() > a.expires_at;

    -- Late submissions are graded on what was saved before the deadline.
    if p_answers is not null and jsonb_typeof(p_answers) = 'array'
       and not (a.expires_at is not null and now() > a.expires_at + grace) then
      for r in
        select * from jsonb_to_recordset(p_answers) as x(question_id uuid, option_ids uuid[], text text)
      loop
        if r.question_id = any (a.question_ids) then
          insert into public.attempt_answers (attempt_id, question_id, selected_option_ids, text_answer)
          values (a.id, r.question_id, public.clean_selection(r.question_id, r.option_ids), left(r.text, 500))
          on conflict (attempt_id, question_id) do update
            set selected_option_ids = excluded.selected_option_ids,
                text_answer = excluded.text_answer,
                answered_at = now()
            where public.attempt_answers.checked = false;
        end if;
      end loop;
    end if;

    perform public.finalize_attempt(a.id, v_late);
  end if;

  select * into a from public.attempts where id = p_attempt_id;
  return jsonb_build_object(
    'id', a.id, 'score', a.score, 'total', a.total_questions,
    'percentage', a.percentage, 'passed', a.passed, 'timed_out', a.timed_out
  );
end;
$$;

-- Full review with answers — only for a submitted attempt owned by the caller.
create or replace function public.get_attempt_result(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.require_user();
  a public.attempts%rowtype;
begin
  select * into a from public.attempts where id = p_attempt_id and user_id = uid;
  if not found then
    raise exception 'Attempt not found' using errcode = 'P0002';
  end if;
  if a.status = 'in_progress' and a.expires_at is not null and now() > a.expires_at then
    perform public.finalize_attempt(a.id, true);
    select * into a from public.attempts where id = p_attempt_id;
  end if;
  if a.status <> 'submitted' then
    raise exception 'Submit the attempt to see the results' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'attempt', jsonb_build_object(
      'id', a.id, 'kind', a.kind, 'title', a.title, 'mode', a.mode,
      'quiz_id', a.quiz_id, 'exam_id', a.exam_id, 'subject_id', a.subject_id, 'unit_id', a.unit_id,
      'score', a.score, 'total_questions', a.total_questions, 'percentage', a.percentage,
      'passed', a.passed, 'pass_percentage', a.pass_percentage, 'timed_out', a.timed_out,
      'duration_seconds', a.duration_seconds, 'started_at', a.started_at, 'submitted_at', a.submitted_at
    ),
    'questions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', q.id, 'type', q.type, 'body', q.body, 'explanation', q.explanation,
        'accepted_answers', case when q.type = 'short_answer' then to_jsonb(q.accepted_answers) end,
        'options', (
          select coalesce(jsonb_agg(jsonb_build_object('id', o.id, 'body', o.body, 'is_correct', o.is_correct)
                                    order by o.position), '[]'::jsonb)
          from public.question_options o where o.question_id = q.id),
        'selected_option_ids', coalesce(aa.selected_option_ids, '{}'),
        'text_answer', aa.text_answer,
        'is_correct', coalesce(aa.is_correct, false)
      ) order by ord.n), '[]'::jsonb)
      from unnest(a.question_ids) with ordinality as ord(qid, n)
      join public.questions q on q.id = ord.qid
      left join public.attempt_answers aa on aa.attempt_id = a.id and aa.question_id = q.id
    )
  );
end;
$$;

-- Grade abandoned timed attempts so exam history is never stuck "in progress".
create or replace function public.finalize_my_expired_attempts()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.require_user();
  r record;
  n integer := 0;
begin
  for r in
    select id from public.attempts
    where user_id = uid and status = 'in_progress' and expires_at is not null and expires_at < now()
  loop
    perform public.finalize_attempt(r.id, true);
    n := n + 1;
  end loop;
  return n;
end;
$$;

-- =============================================================================
-- ADMIN HELPERS
-- =============================================================================

create or replace function public.admin_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  perform public.require_admin();
  return jsonb_build_object(
    'students', (select count(*) from public.profiles where role = 'student'),
    'subjects', (select count(*) from public.subjects),
    'units', (select count(*) from public.units),
    'published_summaries', (select count(*) from public.summaries where status = 'published'),
    'pdfs', (select count(*) from public.learning_resources),
    'questions', (select count(*) from public.questions),
    'quiz_attempts', (select count(*) from public.attempts where kind = 'quiz' and status = 'submitted'),
    'exam_attempts', (select count(*) from public.attempts where kind = 'exam' and status = 'submitted'),
    'recent_students', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
        select id, full_name, email, school, created_at from public.profiles
        where role = 'student' order by created_at desc limit 6) t),
    'recent_activity', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
        select l.id, l.kind, l.title, l.created_at, p.full_name,
               u.title as unit_title, s.title as subject_title
        from public.activity_log l
        join public.profiles p on p.id = l.user_id
        left join public.units u on u.id = l.unit_id
        left join public.subjects s on s.id = l.subject_id
        order by l.created_at desc limit 8) t)
  );
end;
$$;

create or replace function public.admin_analytics(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  tz constant text := 'Africa/Addis_Ababa';
  v_days integer := least(greatest(coalesce(p_days, 30), 7), 180);
  v_today date := (now() at time zone tz)::date;
begin
  perform public.require_admin();
  return jsonb_build_object(
    'registrations_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', c) order by d), '[]'::jsonb) from (
        select g.d, count(p.id) as c
        from generate_series(v_today - (v_days - 1), v_today, interval '1 day') as g(d)
        left join public.profiles p
          on p.role = 'student' and (p.created_at at time zone tz)::date = g.d::date
        group by g.d) x),
    'attempts_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d, 'count', c, 'avg', a) order by d), '[]'::jsonb) from (
        select g.d, count(t.id) as c, round(avg(t.percentage), 1) as a
        from generate_series(v_today - (v_days - 1), v_today, interval '1 day') as g(d)
        left join public.attempts t
          on t.status = 'submitted' and (t.submitted_at at time zone tz)::date = g.d::date
        group by g.d) x),
    'active_students_7d', (
      select count(distinct user_id) from public.activity_log where created_at >= now() - interval '7 days'),
    'active_students_30d', (
      select count(distinct user_id) from public.activity_log where created_at >= now() - interval '30 days'),
    'subject_scores', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
        select s.title, s.color, count(a.id) as attempts, round(avg(a.percentage), 1) as avg_percentage
        from public.subjects s
        left join public.attempts a on a.subject_id = s.id and a.status = 'submitted'
        group by s.id, s.title, s.color, s.position order by s.position) t),
    'popular_units', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
        select u.title as unit_title, s.title as subject_title,
               count(*) as learners,
               count(*) filter (where p.status = 'completed') as completed
        from public.student_progress p
        join public.units u on u.id = p.unit_id
        join public.subjects s on s.id = u.subject_id
        group by u.id, u.title, s.title order by learners desc limit 6) t),
    'hardest_questions', (
      select coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb) from (
        select q.id, left(q.body, 90) as body, count(*) as answered,
               round(100.0 * count(*) filter (where aa.is_correct) / count(*), 1) as accuracy
        from public.attempt_answers aa
        join public.attempts a on a.id = aa.attempt_id and a.status = 'submitted'
        join public.questions q on q.id = aa.question_id
        group by q.id, q.body
        having count(*) >= 3
        order by accuracy asc, answered desc limit 5) t)
  );
end;
$$;

create or replace function public.admin_students(
  p_search text default null, p_limit integer default 20, p_offset integer default 0
)
returns table (
  id uuid, full_name text, email text, school text, location text, role public.user_role,
  is_active boolean, created_at timestamptz, last_active timestamptz,
  completed_units integer, attempts integer, avg_score numeric, total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  pat text := null;
begin
  perform public.require_admin();
  if p_search is not null and trim(p_search) <> '' then
    pat := '%' || replace(replace(replace(trim(p_search), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;
  return query
  select p.id, p.full_name, p.email, p.school, p.location, p.role, p.is_active, p.created_at,
         (select max(l.created_at) from public.activity_log l where l.user_id = p.id),
         (select count(*)::int from public.student_progress sp where sp.user_id = p.id and sp.status = 'completed'),
         (select count(*)::int from public.attempts a where a.user_id = p.id and a.status = 'submitted'),
         (select round(avg(a.percentage), 1) from public.attempts a where a.user_id = p.id and a.status = 'submitted'),
         count(*) over ()
  from public.profiles p
  where pat is null or p.full_name ilike pat or p.email ilike pat or coalesce(p.school, '') ilike pat
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 100) offset greatest(p_offset, 0);
end;
$$;

-- Atomically create / update a question and sync its options (ids are preserved).
create or replace function public.admin_save_question(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := public.require_admin();
  v_id uuid := nullif(p ->> 'id', '')::uuid;
  v_type public.question_type := (p ->> 'type')::public.question_type;
  v_correct integer;
  v_accepted text[];
  opt jsonb;
  i integer := 0;
  v_keep uuid[] := '{}';
  v_opt_id uuid;
begin
  if v_type in ('multiple_choice', 'true_false', 'multiple_select') then
    if jsonb_array_length(coalesce(p -> 'options', '[]'::jsonb)) < 2 then
      raise exception 'Add at least two answer options' using errcode = 'P0001';
    end if;
    select count(*) into v_correct
      from jsonb_array_elements(p -> 'options') o where coalesce((o ->> 'is_correct')::boolean, false);
    if v_correct = 0 then
      raise exception 'Mark at least one correct answer' using errcode = 'P0001';
    end if;
    if v_type <> 'multiple_select' and v_correct <> 1 then
      raise exception 'Choose exactly one correct answer' using errcode = 'P0001';
    end if;
    v_accepted := '{}';
  else
    select coalesce(array_agg(trim(x)) filter (where trim(x) <> ''), '{}') into v_accepted
      from jsonb_array_elements_text(coalesce(p -> 'accepted_answers', '[]'::jsonb)) x;
    if cardinality(v_accepted) = 0 then
      raise exception 'Add at least one accepted answer' using errcode = 'P0001';
    end if;
  end if;

  if v_id is null then
    insert into public.questions (subject_id, unit_id, topic_id, type, body, explanation, accepted_answers, difficulty, created_by)
    values (
      (p ->> 'subject_id')::uuid, nullif(p ->> 'unit_id', '')::uuid, nullif(p ->> 'topic_id', '')::uuid,
      v_type, trim(p ->> 'body'), coalesce(trim(p ->> 'explanation'), ''), v_accepted,
      coalesce(nullif(p ->> 'difficulty', ''), 'medium')::public.difficulty_level, uid
    ) returning id into v_id;
  else
    update public.questions set
      subject_id = (p ->> 'subject_id')::uuid,
      unit_id = nullif(p ->> 'unit_id', '')::uuid,
      topic_id = nullif(p ->> 'topic_id', '')::uuid,
      type = v_type,
      body = trim(p ->> 'body'),
      explanation = coalesce(trim(p ->> 'explanation'), ''),
      accepted_answers = v_accepted,
      difficulty = coalesce(nullif(p ->> 'difficulty', ''), 'medium')::public.difficulty_level
    where id = v_id;
    if not found then
      raise exception 'Question not found' using errcode = 'P0002';
    end if;
  end if;

  if v_type in ('multiple_choice', 'true_false', 'multiple_select') then
    for opt in select * from jsonb_array_elements(p -> 'options') loop
      i := i + 1;
      v_opt_id := nullif(opt ->> 'id', '')::uuid;
      if v_opt_id is not null and exists (
        select 1 from public.question_options where id = v_opt_id and question_id = v_id) then
        update public.question_options
           set body = trim(opt ->> 'body'),
               is_correct = coalesce((opt ->> 'is_correct')::boolean, false),
               position = i
         where id = v_opt_id;
      else
        insert into public.question_options (question_id, body, is_correct, position)
        values (v_id, trim(opt ->> 'body'), coalesce((opt ->> 'is_correct')::boolean, false), i)
        returning id into v_opt_id;
      end if;
      v_keep := v_keep || v_opt_id;
    end loop;
    delete from public.question_options where question_id = v_id and not (id = any (v_keep));
  else
    delete from public.question_options where question_id = v_id;
  end if;

  return v_id;
end;
$$;

create or replace function public.admin_set_quiz_questions(p_quiz_id uuid, p_question_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin();
  delete from public.quiz_questions
   where quiz_id = p_quiz_id and not (question_id = any (coalesce(p_question_ids, '{}')));
  insert into public.quiz_questions (quiz_id, question_id, position)
  select p_quiz_id, x.id, x.ord::int
  from unnest(coalesce(p_question_ids, '{}')) with ordinality as x(id, ord)
  on conflict (quiz_id, question_id) do update set position = excluded.position;
end;
$$;

create or replace function public.admin_set_exam_units(p_exam_id uuid, p_unit_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin();
  delete from public.exam_units
   where exam_id = p_exam_id and not (unit_id = any (coalesce(p_unit_ids, '{}')));
  insert into public.exam_units (exam_id, unit_id)
  select p_exam_id, x from unnest(coalesce(p_unit_ids, '{}')) x
  on conflict do nothing;
end;
$$;

-- Persist a new ordering (1..n) for subjects / units / topics.
create or replace function public.admin_set_positions(p_table text, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.require_admin();
  if p_table = 'subjects' then
    update public.subjects t set position = x.ord::int
      from unnest(p_ids) with ordinality as x(id, ord) where t.id = x.id;
  elsif p_table = 'units' then
    update public.units t set position = x.ord::int
      from unnest(p_ids) with ordinality as x(id, ord) where t.id = x.id;
  elsif p_table = 'topics' then
    update public.topics t set position = x.ord::int
      from unnest(p_ids) with ordinality as x(id, ord) where t.id = x.id;
  else
    raise exception 'Unknown table' using errcode = 'P0001';
  end if;
end;
$$;

-- Remove all sample content in one go. Returns storage paths so the caller can
-- also delete the files from the private bucket.
create or replace function public.admin_delete_demo_content()
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_paths text[];
begin
  perform public.require_admin();
  select coalesce(array_agg(r.storage_path), '{}') into v_paths
    from public.learning_resources r
    where r.is_demo
       or r.subject_id in (select id from public.subjects where is_demo)
       or r.unit_id in (select id from public.units where is_demo);
  delete from public.subjects where is_demo;
  delete from public.units where is_demo;
  delete from public.learning_resources where is_demo;
  delete from public.questions where is_demo;
  delete from public.quizzes where is_demo;
  delete from public.exams where is_demo;
  return v_paths;
end;
$$;

-- -----------------------------------------------------------------------------
-- Function privileges: nothing is callable by anon unless listed below.
-- -----------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon;
grant execute on function public.get_subject_cards() to anon, authenticated;

grant execute on function
  public.is_admin(),
  public.require_user(),
  public.get_subject_units(uuid),
  public.get_student_stats(),
  public.get_recommendations(integer),
  public.get_subject_performance(),
  public.get_topic_performance(),
  public.get_activity_by_day(integer),
  public.search_content(text, integer),
  public.get_notifications(integer),
  public.unread_notification_count(),
  public.mark_all_notifications_read(),
  public.start_quiz_attempt(uuid),
  public.start_exam_attempt(uuid),
  public.get_attempt(uuid),
  public.save_attempt_answer(uuid, uuid, uuid[], text),
  public.check_attempt_answer(uuid, uuid, uuid[], text),
  public.submit_attempt(uuid, jsonb),
  public.get_attempt_result(uuid),
  public.finalize_my_expired_attempts(),
  public.admin_overview(),
  public.admin_analytics(integer),
  public.admin_students(text, integer, integer),
  public.admin_save_question(jsonb),
  public.admin_set_quiz_questions(uuid, uuid[]),
  public.admin_set_exam_units(uuid, uuid[]),
  public.admin_set_positions(text, uuid[]),
  public.admin_delete_demo_content()
to authenticated;
-- Policies call these as the invoking role, so they must stay executable:
grant execute on function
  public.is_admin(), public.subject_is_visible(uuid), public.unit_is_visible(uuid)
to anon, authenticated;
-- finalize_attempt, grade_answer, clean_selection, question_is_gradable,
-- require_admin, normalize_answer: internal only (called by definer functions).

-- Default privileges for future functions: not executable by anon/public.
alter default privileges in schema public revoke execute on functions from public, anon;
