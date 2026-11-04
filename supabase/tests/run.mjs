// Database test suite: migrations + seed + Row Level Security + quiz engine.
//
//   npm run db:test
//
// Needs a PostgreSQL server you can create databases on. Defaults to
// postgres://zetora_test:zetora@127.0.0.1:5432/postgres — override with
// TEST_DATABASE_URL. The suite builds a throw-away database, stubs the few
// Supabase platform objects (roles, auth.uid(), storage), applies every
// migration and the demo seed, then exercises the security model as real
// "authenticated" / "anon" roles with JWT claims — exactly how PostgREST does.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const adminUrl = process.env.TEST_DATABASE_URL || 'postgres://zetora_test:zetora@127.0.0.1:5432/postgres';
const dbName = 'zetora_db_test';

let passed = 0;
const failures = [];
function check(name, cond, extra = '') {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failures.push(name); console.log(`  ✗ ${name} ${extra}`); }
}

// ---- build database ---------------------------------------------------------
const boot = new pg.Client({ connectionString: adminUrl });
await boot.connect();
await boot.query(`drop database if exists ${dbName} with (force)`);
await boot.query(`create database ${dbName}`);
await boot.end();

const url = new URL(adminUrl);
url.pathname = '/' + dbName;
const db = new pg.Client({ connectionString: url.toString() });
await db.connect();
db.on('notice', () => {});

console.log('Applying stubs, migrations and seed…');
await db.query(readFileSync(join(here, 'stubs.sql'), 'utf8'));
for (const f of readdirSync(join(root, 'migrations')).filter((f) => f.endsWith('.sql')).sort()) {
  await db.query(readFileSync(join(root, 'migrations', f), 'utf8'));
}
await db.query(readFileSync(join(root, 'seed.sql'), 'utf8'));

// ---- helpers ------------------------------------------------------------------
async function makeUser(name, role = 'student') {
  const id = randomUUID();
  await db.query(
    `insert into auth.users (id, email, raw_user_meta_data) values ($1, $2, $3)`,
    [id, `${name}-${id.slice(0, 6)}@example.com`, JSON.stringify({ full_name: name, role: 'admin' /* must be ignored */ })],
  );
  if (role === 'admin') await db.query(`update public.profiles set role = 'admin' where id = $1`, [id]);
  return id;
}

/** Run a scenario in one transaction as `userId` (or anon when null); always rolled back. */
async function session(userId, fn) {
  await db.query('begin');
  try {
    if (userId) {
      await db.query(`set local role authenticated`);
      await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: userId, role: 'authenticated' })]);
    } else {
      await db.query(`set local role anon`);
      await db.query(`select set_config('request.jwt.claims', '{"role":"anon"}', true)`);
    }
    let n = 0;
    const s = {
      q: async (sql, params) => (await db.query(sql, params)).rows,
      one: async (sql, params) => (await db.query(sql, params)).rows[0],
      /** Expect the statement to fail; returns the error (transaction survives). */
      fails: async (sql, params) => {
        const sp = `sp${++n}`;
        await db.query(`savepoint ${sp}`);
        try { await db.query(sql, params); await db.query(`release savepoint ${sp}`); return null; }
        catch (e) { await db.query(`rollback to savepoint ${sp}`); return e; }
      },
      /** Temporarily act as the database owner (e.g. to fast-forward a deadline). */
      owner: async (sql, params) => {
        await db.query('reset role');
        const r = await db.query(sql, params);
        await db.query(`set local role authenticated`);
        return r.rows;
      },
    };
    return await fn(s);
  } finally {
    await db.query('rollback');
  }
}

const alice = await makeUser('Alice');
const bob = await makeUser('Bob');
const root_admin = await makeUser('Root Admin', 'admin');

const ids = (await db.query(`
  select
    (select id from subjects where slug = 'mathematics') as math,
    (select id from units where title = 'Functions and Graphs') as math_u1,
    (select id from units where title = 'Limits and Continuity') as math_u2,
    (select id from units where title = 'Differentiation') as math_u3,
    (select id from quizzes where title = 'Functions and Graphs — practice quiz') as practice_quiz,
    (select id from quizzes where title = 'Limits and Continuity — timed quiz') as timed_quiz,
    (select id from exams where title = 'Mathematics — mock exam') as math_exam
`)).rows[0];

// ---- 1. profiles & privilege escalation -------------------------------------
console.log('\nProfiles & roles');
{
  const p = (await db.query(`select role, full_name from public.profiles where id = $1`, [alice])).rows[0];
  check('new users become students even if client metadata asks for admin', p.role === 'student');
  check('full_name comes from signup metadata', p.full_name === 'Alice');

  await session(alice, async (s) => {
    const upd = await s.fails(`update public.profiles set role = 'admin' where id = $1`, [alice]);
    check('student cannot promote themselves to admin', upd && /protected profile fields/.test(upd.message));
    const upd2 = await s.fails(`update public.profiles set is_active = true, email = 'x@y.z' where id = $1`, [alice]);
    check('student cannot change email / is_active', !!upd2);
    await s.q(`update public.profiles set school = 'Test School', location = 'Adama' where id = $1`, [alice]);
    check('student can edit own school/location', (await s.one(`select school from public.profiles where id = $1`, [alice])).school === 'Test School');
    check("student cannot read someone else's profile", (await s.q(`select 1 from public.profiles where id = $1`, [bob])).length === 0);
    check('student sees only their own profile row', (await s.q(`select 1 from public.profiles`)).length === 1);
  });
}

// ---- 2. anonymous access ------------------------------------------------------
console.log('\nAnonymous visitors');
await session(null, async (s) => {
  check('anon can read published subjects (landing page)', (await s.q(`select 1 from public.subjects`)).length === 5);
  check('anon get_subject_cards() works', (await s.q(`select * from public.get_subject_cards()`)).length === 5);
  check('anon cannot read units', !!(await s.fails(`select 1 from public.units`)));
  check('anon cannot read profiles', !!(await s.fails(`select 1 from public.profiles`)));
  check('anon cannot read questions', !!(await s.fails(`select 1 from public.questions`)));
  check('anon cannot call start_quiz_attempt', !!(await s.fails(`select public.start_quiz_attempt($1)`, [ids.practice_quiz])));
  check('anon cannot call search_content', !!(await s.fails(`select * from public.search_content('limit')`)));
});

// ---- 3. content visibility & immutability -----------------------------------
console.log('\nContent access for students');
await db.query(`insert into public.units (subject_id, number, position, title, is_published) values ($1, 99, 99, 'Secret draft unit', false)`, [ids.math]);
await db.query(`insert into public.subjects (slug, title, is_published) values ('draft-subject', 'Draft subject', false)`);
await session(alice, async (s) => {
  check('student sees published units only', (await s.q(`select 1 from public.units where title = 'Secret draft unit'`)).length === 0);
  check('student sees published units', (await s.q(`select 1 from public.units where subject_id = $1`, [ids.math])).length === 5);
  check('student cannot see draft subjects', (await s.q(`select 1 from public.subjects where slug = 'draft-subject'`)).length === 0);
  check('student sees published summaries', (await s.q(`select 1 from public.summaries`)).length === 10);
  check('student cannot read the question bank', (await s.q(`select 1 from public.questions`)).length === 0);
  check('student cannot read answer options (is_correct)', (await s.q(`select 1 from public.question_options`)).length === 0);
  check('student cannot insert subjects', !!(await s.fails(`insert into public.subjects (slug, title) values ('hack', 'Hack')`)));
  const u = await s.q(`update public.units set title = 'Pwned' where id = $1 returning id`, [ids.math_u1]);
  check('student cannot update units (0 rows affected)', u.length === 0);
  const d = await s.q(`delete from public.summaries returning id`);
  check('student cannot delete summaries', d.length === 0);
  check('student cannot insert summaries', !!(await s.fails(`insert into public.summaries (unit_id, content_html, status) values ($1, '<p>x</p>', 'published')`, [ids.math_u3])));
  const cards = await s.q(`select * from public.get_subject_cards() order by position`);
  check('subject cards report real unit counts', cards[0].slug === 'mathematics' && cards[0].unit_count === 5 && cards[0].summary_count === 2);
  const units = await s.q(`select * from public.get_subject_units($1)`, [ids.math]);
  check('get_subject_units hides draft units and flags summaries/quizzes', units.length === 5 && units[0].has_summary && units[0].quiz_count === 1 && !units[2].has_summary);
});

// ---- 4. quiz engine: secrecy + grading -----------------------------------------
console.log('\nQuiz engine (practice mode)');
await session(alice, async (s) => {
  const { start_quiz_attempt: attemptId } = await s.one(`select public.start_quiz_attempt($1)`, [ids.practice_quiz]);
  const again = (await s.one(`select public.start_quiz_attempt($1)`, [ids.practice_quiz])).start_quiz_attempt;
  check('starting an unfinished quiz again resumes the same attempt', again === attemptId);

  const { get_attempt: att } = await s.one(`select public.get_attempt($1)`, [attemptId]);
  check('attempt exposes 6 questions', att.questions.length === 6);
  const leaked = JSON.stringify(att).includes('is_correct') || JSON.stringify(att).includes('explanation');
  check('get_attempt never leaks correctness or explanations before answering', !leaked);

  // find a known question: domain of sqrt(x-3)
  const q1 = att.questions.find((q) => q.body.includes('sqrt{x-3}'));
  const optRows = await s.owner(`select id, body, is_correct from public.question_options where question_id = $1`, [q1.id]);
  const right = optRows.find((o) => o.is_correct);
  const wrong = optRows.find((o) => !o.is_correct);

  const fb = (await s.one(`select public.check_attempt_answer($1, $2, $3::uuid[], null) as r`, [attemptId, q1.id, [wrong.id]])).r;
  check('practice: checking a wrong answer reveals it is wrong + correct option', fb.is_correct === false && fb.correct_option_ids[0] === right.id);
  check('practice: explanation revealed after checking', typeof fb.explanation === 'string' && fb.explanation.length > 0);

  await s.q(`select public.save_attempt_answer($1, $2, $3::uuid[], null)`, [attemptId, q1.id, [right.id]]);
  const stored = (await s.one(`select selected_option_ids from public.attempt_answers where attempt_id = $1 and question_id = $2`, [attemptId, q1.id])).selected_option_ids;
  check('practice: a checked answer is locked and cannot be changed', stored[0] === wrong.id);

  // forged writes
  check('student cannot insert attempts directly', !!(await s.fails(`insert into public.attempts (user_id, kind, title, question_ids, total_questions) values ($1, 'quiz', 'x', '{}', 0)`, [alice])));
  check('student cannot forge a score (no UPDATE privilege on attempts)', !!(await s.fails(`update public.attempts set score = 6, percentage = 100, status = 'submitted'`)));
  check('student cannot insert attempt_answers directly', !!(await s.fails(`insert into public.attempt_answers (attempt_id, question_id, is_correct) values ($1, $2, true)`, [attemptId, q1.id])));
  check('result is hidden until the attempt is submitted', !!(await s.fails(`select public.get_attempt_result($1)`, [attemptId])));

  // Submit: answer everything correctly via the owner view of answers
  const allKeys = await s.owner(`
    select q.id as qid, q.type, q.accepted_answers,
           coalesce(array_agg(o.id) filter (where o.is_correct), '{}') as correct
    from public.questions q left join public.question_options o on o.question_id = q.id
    where q.id in (select unnest(question_ids) from public.attempts where id = $1) group by q.id`, [attemptId]);
  const answers = allKeys.map((k) => ({
    question_id: k.qid,
    option_ids: k.type === 'short_answer' ? [] : k.correct,
    text: k.type === 'short_answer' ? k.accepted_answers[0] : null,
  }));
  // 5 of 6 correct: leave the checked-wrong q1 as is (locked wrong), others correct
  const res = (await s.one(`select public.submit_attempt($1, $2::jsonb) as r`, [attemptId, JSON.stringify(answers)])).r;
  check('submit grades server-side: 5/6 (locked wrong answer stays wrong)', res.score === 5 && res.total === 6 && Number(res.percentage) === 83.33 && res.passed === true);

  const { get_attempt_result: result } = await s.one(`select public.get_attempt_result($1)`, [attemptId]);
  check('result review includes correct answers and explanations', result.questions.every((q) => q.explanation !== undefined && q.options.every((o) => 'is_correct' in o) || q.type === 'short_answer'));
  check('result flags per-question correctness', result.questions.filter((q) => q.is_correct).length === 5);

  const again2 = (await s.one(`select public.submit_attempt($1, null) as r`, [attemptId])).r;
  check('submit is idempotent', again2.score === 5);
  check('cannot save answers after submit', !!(await s.fails(`select public.save_attempt_answer($1, $2, '{}'::uuid[], null)`, [attemptId, q1.id])));

  const act = await s.q(`select kind, title from public.activity_log where ref_id = $1`, [attemptId]);
  check('submission is recorded in the activity log', act.length === 1 && act[0].kind === 'quiz_completed');

  const retry = (await s.one(`select public.start_quiz_attempt($1)`, [ids.practice_quiz])).start_quiz_attempt;
  check('retry creates a brand-new attempt after submission', retry !== attemptId);
});

console.log('\nQuiz engine (exam mode & isolation)');
let bobAttempt;
await session(bob, async (s) => {
  bobAttempt = (await s.one(`select public.start_quiz_attempt($1)`, [ids.timed_quiz])).start_quiz_attempt;
  const att = (await s.one(`select public.get_attempt($1) as a`, [bobAttempt])).a;
  check('timed quiz has an expiry ~10 min ahead', att.attempt.time_limit_seconds === 600 && att.attempt.expires_at !== null);
  const q = att.questions[0];
  check('exam mode: check_attempt_answer is refused', !!(await s.fails(`select public.check_attempt_answer($1, $2, '{}'::uuid[], 'x')`, [bobAttempt, q.id])));
  await s.q(`select public.save_attempt_answer($1, $2, $3::uuid[], null)`, [bobAttempt, q.id, q.options.length ? [q.options[0].id] : []]);
  const saved = await s.q(`select is_correct, checked from public.attempt_answers where attempt_id = $1`, [bobAttempt]);
  check('exam mode: saved answers carry no correctness before submission', saved.length === 1 && saved[0].is_correct === null && saved[0].checked === false);
  const reread = (await s.one(`select public.get_attempt($1) as a`, [bobAttempt])).a;
  check('exam mode: refreshing returns saved answers, still without correctness', reread.answers.length === 1 && reread.answers[0].is_correct === null);
});
// Bob's attempt was rolled back above (the session is a transaction) — create a persistent one for isolation tests.
await db.query(`begin`);
await db.query(`set local role authenticated`);
await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: bob, role: 'authenticated' })]);
const persisted = (await db.query(`select public.start_quiz_attempt($1) as id`, [ids.timed_quiz])).rows[0].id;
await db.query(`commit`);
await db.query(`reset role`);
await session(alice, async (s) => {
  check("student cannot read another student's attempt row", (await s.q(`select 1 from public.attempts where id = $1`, [persisted])).length === 0);
  check("student cannot load another student's attempt via RPC", !!(await s.fails(`select public.get_attempt($1)`, [persisted])));
  check("student cannot save answers into another student's attempt", !!(await s.fails(`select public.save_attempt_answer($1, gen_random_uuid(), '{}'::uuid[], null)`, [persisted])));
  check("student cannot submit another student's attempt", !!(await s.fails(`select public.submit_attempt($1, null)`, [persisted])));
});

// ---- 5. timers ----------------------------------------------------------------
console.log('\nExam timing (cannot be bypassed by refreshing)');
await session(alice, async (s) => {
  const examAttempt = (await s.one(`select public.start_exam_attempt($1)`, [ids.math_exam])).start_exam_attempt;
  const a1 = (await s.one(`select public.get_attempt($1) as a`, [examAttempt])).a;
  check('mock exam draws 10 random questions from the 12-question pool', a1.questions.length === 10);
  const secs = (await s.one(`select extract(epoch from (expires_at - started_at))::int as s from public.attempts where id = $1`, [examAttempt])).s;
  check('mock exam duration is 15 minutes', secs === 900);
  const resumed = (await s.one(`select public.start_exam_attempt($1)`, [ids.math_exam])).start_exam_attempt;
  check('re-opening the exam resumes the same attempt with the same deadline', resumed === examAttempt);

  const q = a1.questions[0];
  const opt = q.options[0]?.id;
  await s.q(`select public.save_attempt_answer($1, $2, $3::uuid[], 'x')`, [examAttempt, q.id, opt ? [opt] : []]);

  // Fast-forward: deadline 1 minute ago (beyond the 15 s grace)
  await s.owner(`update public.attempts set expires_at = now() - interval '1 minute', started_at = now() - interval '16 minutes' where id = $1`, [examAttempt]);
  check('saving an answer after the deadline is rejected', (await s.fails(`select public.save_attempt_answer($1, $2, '{}'::uuid[], 'y')`, [examAttempt, q.id]))?.code === 'ZT001');
  const expired = (await s.one(`select public.get_attempt($1) as a`, [examAttempt])).a;
  check('loading an expired attempt auto-submits it (timed_out)', expired.attempt.status === 'submitted');
  const row = await s.one(`select status, timed_out, duration_seconds, score from public.attempts where id = $1`, [examAttempt]);
  check('auto-submitted attempt is graded and flagged timed_out', row.status === 'submitted' && row.timed_out === true && row.duration_seconds === 900 && row.score !== null);
});
await session(alice, async (s) => {
  const examAttempt = (await s.one(`select public.start_exam_attempt($1)`, [ids.math_exam])).start_exam_attempt;
  await s.owner(`update public.attempts set expires_at = now() - interval '2 minutes', started_at = now() - interval '17 minutes' where id = $1`, [examAttempt]);
  const out = (await s.one(`select public.submit_attempt($1, $2::jsonb) as r`, [examAttempt, JSON.stringify([{ question_id: randomUUID(), option_ids: [] }])])).r;
  check('late manual submit is accepted but flagged timed_out', out.timed_out === true);
  const e2 = (await s.one(`select public.start_exam_attempt($1)`, [ids.math_exam])).start_exam_attempt;
  await s.owner(`update public.attempts set expires_at = now() - interval '5 minutes' where id = $1`, [e2]);
  check('finalize_my_expired_attempts grades abandoned attempts', (await s.one(`select public.finalize_my_expired_attempts() as n`)).n === 1);
});

// ---- 6. progress, bookmarks, stats, recommendations, search -----------------------
console.log('\nProgress, bookmarks and analytics');
await session(alice, async (s) => {
  await s.q(`insert into public.student_progress (user_id, unit_id, subject_id, reading_progress) values ($1, $2, gen_random_uuid(), 40)`, [alice, ids.math_u1]);
  const p = await s.one(`select subject_id, status, reading_progress from public.student_progress where unit_id = $1`, [ids.math_u1]);
  check('progress subject_id is derived from the unit (client value ignored)', p.subject_id === ids.math);
  await s.q(`update public.student_progress set status = 'completed' where unit_id = $1`, [ids.math_u1]);
  const p2 = await s.one(`select reading_progress, completed_at from public.student_progress where unit_id = $1`, [ids.math_u1]);
  check('completing a unit sets 100% and a timestamp', p2.reading_progress === 100 && p2.completed_at !== null);
  check("student cannot write progress for another user", !!(await s.fails(`insert into public.student_progress (user_id, unit_id, subject_id) values ($1, $2, $3)`, [bob, ids.math_u2, ids.math])));
  check('student cannot write progress for an unpublished unit', !!(await s.fails(`insert into public.student_progress (user_id, unit_id, subject_id) values ($1, (select id from public.units where title = 'Secret draft unit' limit 1), $2)`, [alice, ids.math])));

  await s.q(`insert into public.bookmarks (user_id, unit_id) values ($1, $2)`, [alice, ids.math_u2]);
  check('bookmark can be created', (await s.q(`select 1 from public.bookmarks`)).length === 1);
  check('duplicate bookmarks are rejected', !!(await s.fails(`insert into public.bookmarks (user_id, unit_id) values ($1, $2)`, [alice, ids.math_u2])));
  check("student cannot bookmark for someone else", !!(await s.fails(`insert into public.bookmarks (user_id, unit_id) values ($1, $2)`, [bob, ids.math_u1])));

  const stats = (await s.one(`select public.get_student_stats() as s`)).s;
  check('stats: 1 completed unit out of 25 published', stats.completed_units === 1 && stats.total_units === 25);
  const recs = await s.q(`select * from public.get_recommendations(6)`);
  check('recommendations suggest a next unit in each subject', recs.length >= 4 && recs.some((r) => r.reason === 'next'));
  check('recommendations never suggest the completed unit', !recs.some((r) => r.unit_id === ids.math_u1));

  const search = await s.q(`select kind, title, snippet, subject_slug, unit_number from public.search_content('inverse')`);
  check('search finds summaries with highlighted snippets', search.some((r) => r.kind === 'summary' && r.snippet.includes('[[')));
  check('search finds units by title', (await s.q(`select 1 from public.search_content('Newton')`)).some(() => true));
  check('search finds topics', (await s.q(`select 1 from public.search_content('osmosis')`)).length > 0);
  check('search ignores one-character queries', (await s.q(`select 1 from public.search_content('a')`)).length === 0);
  check('search escapes LIKE wildcards', (await s.q(`select 1 from public.search_content('%%')`)).length === 0);
  check('search does not reveal draft units', (await s.q(`select 1 from public.search_content('Secret draft')`)).length === 0);
  const days = await s.q(`select * from public.get_activity_by_day(7)`);
  check('activity-by-day returns a 7-day window', days.length === 7);
});

// ---- 7. notifications --------------------------------------------------------
console.log('\nNotifications');
await db.query(`insert into public.subjects (slug, title, description, is_published) values ('geography', 'Geography', 'Maps and more', true)`);
await session(alice, async (s) => {
  const list = await s.q(`select * from public.get_notifications(10)`);
  check('publishing a subject broadcasts a notification', list.some((n) => n.title === 'New subject: Geography' && n.link === '/subjects/geography'));
  const before = (await s.one(`select public.unread_notification_count() as c`)).c;
  const first = list[0];
  await s.q(`insert into public.notification_reads (user_id, notification_id) values ($1, $2)`, [alice, first.id]);
  const after = (await s.one(`select public.unread_notification_count() as c`)).c;
  check('marking a notification read lowers the unread count', after === before - 1);
  await s.q(`select public.mark_all_notifications_read()`);
  check('mark all read clears the badge', (await s.one(`select public.unread_notification_count() as c`)).c === 0);
  check("student cannot mark notifications read for someone else", !!(await s.fails(`insert into public.notification_reads (user_id, notification_id) values ($1, $2)`, [bob, first.id])));
  check('student cannot create notifications', !!(await s.fails(`insert into public.notifications (title) values ('spam')`)));
});
await session(bob, async (s) => {
  check('read state is per-user (Bob still has unread)', (await s.one(`select public.unread_notification_count() as c`)).c >= 1);
});

// ---- 8. admin ---------------------------------------------------------------------
console.log('\nAdministrator');
await session(alice, async (s) => {
  check('student cannot call admin_overview', (await s.fails(`select public.admin_overview()`))?.code === '42501');
  check('student cannot call admin_students', (await s.fails(`select * from public.admin_students()`))?.code === '42501');
  check('student cannot call admin_save_question', (await s.fails(`select public.admin_save_question('{}'::jsonb)`))?.code === '42501');
  check('student cannot call admin_delete_demo_content', (await s.fails(`select public.admin_delete_demo_content()`))?.code === '42501');
});
await session(root_admin, async (s) => {
  const ov = (await s.one(`select public.admin_overview() as o`)).o;
  check('admin overview counts real rows', ov.students === 2 && ov.subjects >= 6 && ov.questions === 60 && ov.published_summaries === 10);
  const an = (await s.one(`select public.admin_analytics(30) as a`)).a;
  check('admin analytics returns a 30-day registration series', an.registrations_by_day.length === 30);
  const studs = await s.q(`select * from public.admin_students('ali', 10, 0)`);
  check('admin can search students', studs.length === 1 && studs[0].full_name === 'Alice' && Number(studs[0].total_count) === 1);

  await s.q(`insert into public.subjects (slug, title, is_published) values ('admin-made', 'Admin Made', false)`);
  check('admin can create subjects', (await s.q(`select 1 from public.subjects where slug = 'admin-made'`)).length === 1);
  check('admin sees draft units', (await s.q(`select 1 from public.units where title = 'Secret draft unit'`)).length === 1);
  check('admin can read the question bank', (await s.q(`select 1 from public.questions`)).length === 60);

  const base = { subject_id: ids.math, unit_id: ids.math_u1, type: 'multiple_choice', body: 'Pick B', difficulty: 'easy', explanation: 'Because B.' };
  check('admin_save_question rejects questions with no correct option', /correct/.test((await s.fails(`select public.admin_save_question($1::jsonb)`, [JSON.stringify({ ...base, options: [{ body: 'A' }, { body: 'B' }] })])).message));
  check('admin_save_question rejects two correct options for single-answer types', /exactly one/.test((await s.fails(`select public.admin_save_question($1::jsonb)`, [JSON.stringify({ ...base, options: [{ body: 'A', is_correct: true }, { body: 'B', is_correct: true }] })])).message));
  const qid = (await s.one(`select public.admin_save_question($1::jsonb) as id`, [JSON.stringify({ ...base, options: [{ body: 'A' }, { body: 'B', is_correct: true }, { body: 'C' }] })])).id;
  const opts = await s.q(`select id, body from public.question_options where question_id = $1 order by position`, [qid]);
  check('admin_save_question creates a question with ordered options', opts.length === 3 && opts[1].body === 'B');
  await s.q(`select public.admin_save_question($1::jsonb)`, [JSON.stringify({ ...base, id: qid, body: 'Pick C', options: [{ id: opts[0].id, body: 'A' }, { id: opts[1].id, body: 'B' }, { id: opts[2].id, body: 'C', is_correct: true }] })]);
  const opts2 = await s.q(`select id, is_correct from public.question_options where question_id = $1 order by position`, [qid]);
  check('editing a question preserves option ids and moves the correct flag', opts2[0].id === opts[0].id && opts2[2].is_correct && !opts2[1].is_correct);
  await s.q(`select public.admin_set_quiz_questions($1, $2::uuid[])`, [ids.practice_quiz, [qid]]);
  check('admin can replace a quiz\'s questions atomically', (await s.q(`select 1 from public.quiz_questions where quiz_id = $1`, [ids.practice_quiz])).length === 1);

  await s.q(`select public.admin_set_positions('units', $1::uuid[])`, [[ids.math_u2, ids.math_u1]]);
  const pos = await s.q(`select id, position from public.units where id = any($1::uuid[]) order by position`, [[ids.math_u1, ids.math_u2]]);
  check('admin can reorder units', pos[0].id === ids.math_u2 && pos[0].position === 1);
  check('admin_set_positions rejects unknown tables', !!(await s.fails(`select public.admin_set_positions('profiles', '{}'::uuid[])`)));

  check('last administrator cannot be demoted', /administrator is required/.test((await s.fails(`update public.profiles set role = 'student' where id = $1`, [root_admin])).message));
  await s.q(`update public.profiles set role = 'admin' where id = $1`, [bob]);
  check('admin can promote another user', (await s.one(`select role from public.profiles where id = $1`, [bob])).role === 'admin');

  const removed = (await s.one(`select public.admin_delete_demo_content() as p`)).p;
  check('remove-demo-content deletes all demo rows', (await s.one(`select (select count(*) from public.subjects where is_demo) + (select count(*) from public.questions where is_demo) + (select count(*) from public.exams where is_demo) as n`)).n === '0' && Array.isArray(removed));
  check('removing demo content keeps real (non-demo) content', (await s.q(`select 1 from public.subjects where slug in ('geography', 'admin-made')`)).length === 2);

  await s.q(`update public.profiles set role = 'student' where id = $1`, [root_admin]);
  check('an admin can step down once another admin exists', (await s.one(`select role from public.profiles where id = $1`, [root_admin])).role === 'student');
});

// ---- 9. storage policies ------------------------------------------------------------
console.log('\nStorage (private resources bucket)');
const pdfPath = `mathematics/${randomUUID()}.pdf`;
const draftPath = `mathematics/${randomUUID()}.pdf`;
await db.query(`insert into storage.objects (bucket_id, name) values ('resources', $1), ('resources', $2)`, [pdfPath, draftPath]);
await db.query(`insert into public.subjects (id, slug, title, is_published) values ('00000000-0000-4000-8000-000000000001', 'storage-subj', 'Storage subject', true)`);
await db.query(`insert into public.learning_resources (subject_id, title, storage_path, file_name, is_published) values ('00000000-0000-4000-8000-000000000001', 'Published PDF', $1, 'a.pdf', true), ('00000000-0000-4000-8000-000000000001', 'Draft PDF', $2, 'b.pdf', false)`, [pdfPath, draftPath]);
await session(alice, async (s) => {
  const rows = await s.q(`select name from storage.objects where bucket_id = 'resources'`);
  check('student can read a PUBLISHED resource object', rows.some((r) => r.name === pdfPath));
  check('student cannot read an unpublished resource object', !rows.some((r) => r.name === draftPath));
  check('student cannot upload to the resources bucket', !!(await s.fails(`insert into storage.objects (bucket_id, name) values ('resources', 'evil.pdf')`)));
  check('student cannot delete resource objects', (await s.q(`delete from storage.objects where bucket_id = 'resources' returning name`)).length === 0);
  check('student can upload their own avatar', !(await s.fails(`insert into storage.objects (bucket_id, name) values ('media', $1)`, [`avatars/${alice}/me.png`])));
  check("student cannot upload into someone else's avatar folder", !!(await s.fails(`insert into storage.objects (bucket_id, name) values ('media', $1)`, [`avatars/${bob}/me.png`])));
  check('student cannot upload subject covers', !!(await s.fails(`insert into storage.objects (bucket_id, name) values ('media', 'subjects/cover.png')`)));
});
await session(root_admin, async (s) => {
  check('admin can upload to the resources bucket', !(await s.fails(`insert into storage.objects (bucket_id, name) values ('resources', 'admin-upload.pdf')`)));
  check('admin can read unpublished resource objects', (await s.q(`select name from storage.objects where bucket_id = 'resources'`)).some((r) => r.name === draftPath));
});
const bucket = (await db.query(`select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'resources'`)).rows[0];
check('resources bucket is private, 25 MB limit, restricted MIME types', bucket.public === false && Number(bucket.file_size_limit) === 26214400 && bucket.allowed_mime_types.includes('application/pdf') && !bucket.allowed_mime_types.includes('text/html'));

// ---- done ---------------------------------------------------------------------------
await db.end();
console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) {
  console.log('Failures:\n - ' + failures.join('\n - '));
  process.exit(1);
}
