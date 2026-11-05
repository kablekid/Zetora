-- =============================================================================
-- Zetora — language support (English / Amharic)
--   * profiles.locale is limited to the languages the app ships
--   * new accounts start in the language they registered in
--   * notifications carry structured params so the UI can render
--     "New subject: <name>" in the reader's own language
-- =============================================================================

alter table public.profiles
  add constraint profiles_locale_check check (locale in ('en', 'am'));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_locale text := coalesce(new.raw_user_meta_data ->> 'locale', 'en');
begin
  insert into public.profiles (id, email, full_name, locale)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), split_part(coalesce(new.email, ''), '@', 1)), 120),
    case when v_locale in ('en', 'am') then v_locale else 'en' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

alter table public.notifications
  add column params jsonb not null default '{}'::jsonb;

create or replace function public.notify_on_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  became_published boolean;
  v_slug text;
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
    insert into public.notifications (kind, title, body, link, params)
    values ('subject', 'New subject: ' || new.title, left(new.description, 200), '/subjects/' || new.slug,
            jsonb_build_object('name', new.title));

  elsif tg_table_name = 'learning_resources' then
    select s.slug into v_slug from public.subjects s where s.id = new.subject_id;
    insert into public.notifications (kind, title, body, link, params)
    values (
      'material',
      'New learning material: ' || new.title,
      left(new.description, 200),
      case when new.unit_id is null
        then '/subjects/' || v_slug
        else '/subjects/' || v_slug || '/units/' || new.unit_id || '?tab=materials' end,
      jsonb_build_object('name', new.title)
    );

  elsif tg_table_name = 'quizzes' then
    select s.slug into v_slug from public.subjects s where s.id = new.subject_id;
    insert into public.notifications (kind, title, body, link, params)
    values (
      'quiz',
      'New quiz available: ' || new.title,
      left(new.description, 200),
      case when new.unit_id is null
        then '/subjects/' || v_slug
        else '/subjects/' || v_slug || '/units/' || new.unit_id || '?tab=quiz' end,
      jsonb_build_object('name', new.title)
    );

  elsif tg_table_name = 'exams' then
    insert into public.notifications (kind, title, body, link, params)
    values ('exam', 'New exam available: ' || new.title, left(new.description, 200), '/exams/' || new.id,
            jsonb_build_object('name', new.title));
  end if;

  return new;
end;
$$;

-- The return type changes, so the function has to be recreated.
drop function if exists public.get_notifications(integer);
create function public.get_notifications(p_limit integer default 30)
returns table (
  id uuid, kind public.notification_kind, title text, body text, link text, params jsonb,
  created_at timestamptz, is_read boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select n.id, n.kind, n.title, n.body, n.link, n.params, n.created_at,
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
revoke execute on function public.get_notifications(integer) from public, anon;
grant execute on function public.get_notifications(integer) to authenticated;
