-- =============================================================================
-- Zetora — security: helper functions, triggers, Row Level Security, storage
--
-- Threat model in one paragraph: the browser is untrusted. The anon key is
-- public, so RLS is the only thing between a student and everyone else's data.
-- Students may READ published content, READ/WRITE their own progress, and
-- READ their own attempts. They may never write content or attempts directly;
-- attempts are created, saved and graded by SECURITY DEFINER functions (0003),
-- which is also the only way to see correct answers.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin' and p.is_active
  );
$$;

create or replace function public.subject_is_visible(p_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.subjects s where s.id = p_subject_id and s.is_published);
$$;

create or replace function public.unit_is_visible(p_unit_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.units u
    join public.subjects s on s.id = u.subject_id
    where u.id = p_unit_id and u.is_published and s.is_published
  );
$$;

-- -----------------------------------------------------------------------------
-- New users get a student profile. The role is NEVER read from client metadata.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, ''), '@', 1)), 120)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

-- Block privilege escalation: only admins (or trusted SQL with no JWT, e.g. the
-- SQL editor) can change role / is_active / email / id.
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    if new.id is distinct from old.id
       or new.role is distinct from old.role
       or new.is_active is distinct from old.is_active
       or new.email is distinct from old.email then
      raise exception 'You are not allowed to change protected profile fields'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- Progress rows always carry the subject of their unit.
create or replace function public.set_progress_subject()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  select u.subject_id into new.subject_id from public.units u where u.id = new.unit_id;
  if new.subject_id is null then
    raise exception 'Unknown unit' using errcode = '23503';
  end if;
  if new.status = 'completed' then
    new.reading_progress = 100;
    new.completed_at = coalesce(new.completed_at, now());
  else
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger student_progress_set_subject
  before insert or update on public.student_progress
  for each row execute function public.set_progress_subject();

-- -----------------------------------------------------------------------------
-- Notifications: broadcast when content goes live.
-- Seed scripts can set  select set_config('app.skip_notifications','on',false)
-- -----------------------------------------------------------------------------
create or replace function public.notify_on_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  became_published boolean;
  v_slug text;
  v_unit_number integer;
begin
  if coalesce(current_setting('app.skip_notifications', true), '') = 'on' then
    return new;
  end if;

  if tg_op = 'INSERT' then
    became_published := new.is_published;
  else
    became_published := new.is_published and not old.is_published;
  end if;
  if not became_published then
    return new;
  end if;

  if tg_table_name = 'subjects' then
    insert into public.notifications (kind, title, body, link)
    values ('subject', 'New subject: ' || new.title, left(new.description, 200), '/subjects/' || new.slug);

  elsif tg_table_name = 'learning_resources' then
    select s.slug into v_slug from public.subjects s where s.id = new.subject_id;
    insert into public.notifications (kind, title, body, link)
    values (
      'material',
      'New learning material: ' || new.title,
      left(new.description, 200),
      case when new.unit_id is null
        then '/subjects/' || v_slug
        else '/subjects/' || v_slug || '/units/' || new.unit_id || '?tab=materials' end
    );

  elsif tg_table_name = 'quizzes' then
    select s.slug into v_slug from public.subjects s where s.id = new.subject_id;
    insert into public.notifications (kind, title, body, link)
    values (
      'quiz',
      'New quiz available: ' || new.title,
      left(new.description, 200),
      case when new.unit_id is null
        then '/subjects/' || v_slug
        else '/subjects/' || v_slug || '/units/' || new.unit_id || '?tab=quiz' end
    );

  elsif tg_table_name = 'exams' then
    insert into public.notifications (kind, title, body, link)
    values ('exam', 'New exam available: ' || new.title, left(new.description, 200), '/exams/' || new.id);
  end if;

  return new;
end;
$$;

create trigger subjects_notify after insert or update of is_published on public.subjects
  for each row execute function public.notify_on_publish();
create trigger resources_notify after insert or update of is_published on public.learning_resources
  for each row execute function public.notify_on_publish();
create trigger quizzes_notify after insert or update of is_published on public.quizzes
  for each row execute function public.notify_on_publish();
create trigger exams_notify after insert or update of is_published on public.exams
  for each row execute function public.notify_on_publish();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.subjects            enable row level security;
alter table public.units               enable row level security;
alter table public.topics              enable row level security;
alter table public.summaries           enable row level security;
alter table public.learning_resources  enable row level security;
alter table public.questions           enable row level security;
alter table public.question_options    enable row level security;
alter table public.quizzes             enable row level security;
alter table public.quiz_questions      enable row level security;
alter table public.exams               enable row level security;
alter table public.exam_units          enable row level security;
alter table public.attempts            enable row level security;
alter table public.attempt_answers     enable row level security;
alter table public.student_progress    enable row level security;
alter table public.activity_log        enable row level security;
alter table public.bookmarks           enable row level security;
alter table public.notifications       enable row level security;
alter table public.notification_reads  enable row level security;

-- Least privilege first: nothing for anon except the public subject catalogue.
revoke all on all tables in schema public from anon;
grant select on public.subjects to anon;

-- profiles ---------------------------------------------------------------
create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- subjects ---------------------------------------------------------------
create policy subjects_read_published on public.subjects
  for select to anon, authenticated
  using (is_published);
create policy subjects_admin_all on public.subjects
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- units ------------------------------------------------------------------
create policy units_read_published on public.units
  for select to authenticated
  using (is_published and public.subject_is_visible(subject_id));
create policy units_admin_all on public.units
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- topics -----------------------------------------------------------------
create policy topics_read_published on public.topics
  for select to authenticated
  using (public.unit_is_visible(unit_id));
create policy topics_admin_all on public.topics
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- summaries --------------------------------------------------------------
create policy summaries_read_published on public.summaries
  for select to authenticated
  using (status = 'published' and public.unit_is_visible(unit_id));
create policy summaries_admin_all on public.summaries
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- learning_resources ----------------------------------------------------
create policy resources_read_published on public.learning_resources
  for select to authenticated
  using (
    is_published
    and public.subject_is_visible(subject_id)
    and (unit_id is null or public.unit_is_visible(unit_id))
  );
create policy resources_admin_all on public.learning_resources
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- question bank: admin only. Students never read these tables. ---------------
create policy questions_admin_all on public.questions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy question_options_admin_all on public.question_options
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- quizzes ----------------------------------------------------------------
create policy quizzes_read_published on public.quizzes
  for select to authenticated
  using (
    is_published
    and public.subject_is_visible(subject_id)
    and (unit_id is null or public.unit_is_visible(unit_id))
  );
create policy quizzes_admin_all on public.quizzes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- quiz_questions only reveals ids/positions for quizzes the student can see.
create policy quiz_questions_read_visible on public.quiz_questions
  for select to authenticated
  using (exists (select 1 from public.quizzes q where q.id = quiz_id));
create policy quiz_questions_admin_all on public.quiz_questions
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- exams ------------------------------------------------------------------
create policy exams_read_published on public.exams
  for select to authenticated
  using (is_published and (subject_id is null or public.subject_is_visible(subject_id)));
create policy exams_admin_all on public.exams
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy exam_units_read_visible on public.exam_units
  for select to authenticated
  using (exists (select 1 from public.exams e where e.id = exam_id));
create policy exam_units_admin_all on public.exam_units
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- attempts / answers: READ-ONLY for their owner. All writes go through RPCs. --
create policy attempts_select_own on public.attempts
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy attempt_answers_select_own on public.attempt_answers
  for select to authenticated
  using (
    exists (
      select 1 from public.attempts a
      where a.id = attempt_id and (a.user_id = auth.uid() or public.is_admin())
    )
  );

-- progress / activity / bookmarks: owner only ----------------------------------
create policy progress_select_own on public.student_progress
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy progress_insert_own on public.student_progress
  for insert to authenticated
  with check (user_id = auth.uid() and public.unit_is_visible(unit_id));
create policy progress_update_own on public.student_progress
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy progress_delete_own on public.student_progress
  for delete to authenticated
  using (user_id = auth.uid());

create policy activity_select_own on public.activity_log
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy activity_insert_own on public.activity_log
  for insert to authenticated
  with check (user_id = auth.uid());

create policy bookmarks_select_own on public.bookmarks
  for select to authenticated
  using (user_id = auth.uid());
create policy bookmarks_insert_own on public.bookmarks
  for insert to authenticated
  with check (user_id = auth.uid() and public.unit_is_visible(unit_id));
create policy bookmarks_delete_own on public.bookmarks
  for delete to authenticated
  using (user_id = auth.uid());

-- notifications ------------------------------------------------------------
create policy notifications_read_visible on public.notifications
  for select to authenticated
  using (user_id is null or user_id = auth.uid() or public.is_admin());
create policy notifications_admin_all on public.notifications
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy notification_reads_select_own on public.notification_reads
  for select to authenticated
  using (user_id = auth.uid());
create policy notification_reads_insert_own on public.notification_reads
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.notifications n where n.id = notification_id)
  );
create policy notification_reads_delete_own on public.notification_reads
  for delete to authenticated
  using (user_id = auth.uid());

-- Attempts are written ONLY by SECURITY DEFINER functions. Take write privileges
-- away at the grant level as well, so a policy added by mistake later cannot
-- let a student forge a score. (Content tables stay writable at grant level:
-- admins are ordinary "authenticated" users, and the *_admin_all policies are
-- what gate them.)
revoke insert, update, delete on public.attempts, public.attempt_answers from authenticated;

-- -----------------------------------------------------------------------------
-- Storage buckets
--   resources : PRIVATE. PDFs / notes / reference documents. Signed URLs only.
--   media     : PUBLIC.  Avatars, subject covers, images inside summaries.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('resources', 'resources', false, 26214400,
    array['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain']),
  ('media', 'media', true, 5242880,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- resources: admins manage, students may only read PUBLISHED, visible resources.
create policy resources_bucket_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'resources' and public.is_admin())
  with check (bucket_id = 'resources' and public.is_admin());

create policy resources_bucket_student_read on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resources'
    and exists (
      select 1 from public.learning_resources r
      where r.storage_path = storage.objects.name
        and r.is_published
        and public.subject_is_visible(r.subject_id)
        and (r.unit_id is null or public.unit_is_visible(r.unit_id))
    )
  );

-- media: admins write subject covers + summary images; users write only inside
-- their own avatars/<uid>/ folder.
create policy media_admin_all on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy media_avatar_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
create policy media_avatar_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
create policy media_avatar_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and (storage.foldername(name))[1] = 'avatars'
    and (storage.foldername(name))[2] = auth.uid()::text
  );
