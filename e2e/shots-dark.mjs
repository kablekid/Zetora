// Visual sweep: every major screen in a chosen theme/locale.   node e2e/shots-dark.mjs [dark|light] [en|am]
import { BASE, launch, login, newSession, shot } from './lib.mjs';
import { makePdf } from './pdf.mjs';
import pg from 'pg';

const theme = process.argv[2] || 'dark';
const locale = process.argv[3] || 'en';
const tag = `${theme}-${locale}`;
const db = new pg.Client({ connectionString: 'postgres://zetora_test:zetora@127.0.0.1:5432/zetora_e2e' });
await db.connect();
const browser = await launch();
const q = async (s, p) => (await db.query(s, p)).rows;

async function session(mobile = false) {
  const s = await newSession(browser, { mobile, colorScheme: theme });
  await s.context.addCookies([{ name: 'zetora-locale', value: locale, url: BASE }]);
  return s;
}

// --- a student with believable activity -----------------------------------
const email = `dark.${Date.now()}@example.com`;
{
  const { page, context } = await session();
  await page.goto(`${BASE}/register`);
  await page.fill('#fullName', 'Hana Bekele'); await page.fill('#email', email);
  await page.fill('#password', 'Passw0rd1'); await page.fill('#confirmPassword', 'Passw0rd1');
  await page.getByRole('button').filter({ hasText: /./ }).last().click().catch(() => {});
  await page.waitForURL(/dashboard/, { timeout: 15000 });
  await context.close();
}
const uid = (await q(`select id from profiles where email = $1`, [email]))[0].id;
const units = await q(`select u.id, u.subject_id, s.slug from units u join subjects s on s.id = u.subject_id where u.position = 1 order by s.position`);
for (const u of units.slice(0, 2)) await q(`insert into student_progress (user_id, unit_id, subject_id, status, reading_progress) values ($1,$2,$3,'completed',100)`, [uid, u.id, u.subject_id]);
await q(`insert into student_progress (user_id, unit_id, subject_id, status, reading_progress) select $1, id, subject_id, 'in_progress', 55 from units where title = 'Limits and Continuity'`, [uid]);
for (const [pct, kind, title, days] of [[50, 'quiz', 'Functions and Graphs — practice quiz', 6], [67, 'quiz', 'Kinematics — practice quiz', 4], [83, 'quiz', 'Atomic Structure — practice quiz', 2], [72, 'exam', 'Mathematics — mock exam', 1]]) {
  const sub = (await q(`select subject_id from units where title = $1 or $2 like title || '%' limit 1`, [title.split(' — ')[0], title]))[0];
  await q(`insert into attempts (user_id, kind, title, subject_id, status, question_ids, total_questions, score, percentage, pass_percentage, passed, started_at, submitted_at, duration_seconds, mode) values ($1,$2,$3,$4,'submitted','{}',6,$5,$6,60,$7, now() - ($8 || ' days')::interval, now() - ($8 || ' days')::interval, 240, 'practice')`, [uid, kind, title, sub?.subject_id ?? units[0].subject_id, Math.round(pct / 100 * 6), pct, pct >= 60, String(days)]);
}
await q(`insert into activity_log (user_id, kind, unit_id, subject_id, title, created_at) select $1, 'unit_opened', id, subject_id, title, now() - interval '3 hours' from units where title = 'Limits and Continuity'`, [uid]);
await q(`insert into activity_log (user_id, kind, subject_id, title, meta, created_at) values ($1,'quiz_completed',(select id from subjects where slug='physics'),'Kinematics — practice quiz','{"percentage":67}', now() - interval '1 day')`, [uid]);

const mathUnit = (await q(`select id from units where title = 'Functions and Graphs'`))[0].id;

// --- a PDF for the viewer + one admin-ish page set -------------------------------
const pdfPath = `mathematics/${Date.now()}.pdf`;
await q(`insert into storage.objects (bucket_id, name) values ('resources', $1)`, [pdfPath]);
const pdfFile = new URL(`./.run/storage/resources/${pdfPath}`, import.meta.url).pathname;
const { mkdirSync, writeFileSync } = await import('node:fs');
mkdirSync(pdfFile.slice(0, pdfFile.lastIndexOf('/')), { recursive: true });
writeFileSync(pdfFile, makePdf(['Functions — worked examples', 'Page two', 'Page three']));
const res = (await q(`insert into learning_resources (subject_id, unit_id, title, description, storage_path, file_name, file_size, is_published) values ((select id from subjects where slug='mathematics'), $1, 'Functions — worked examples', 'Three pages of examples.', $2, 'functions.pdf', 900, true) returning id`, [mathUnit, pdfPath]))[0].id;

const { page, context } = await session();
await login(page, email, 'Passw0rd1');
const pages = [
  ['dashboard', '/dashboard'], ['subjects', '/subjects'], ['subject', '/subjects/mathematics'],
  ['unit', `/subjects/mathematics/units/${mathUnit}`], ['summary', `/subjects/mathematics/units/${mathUnit}?tab=summary`],
  ['materials', `/subjects/mathematics/units/${mathUnit}?tab=materials`], ['quiz-tab', `/subjects/mathematics/units/${mathUnit}?tab=quiz`],
  ['progress', '/progress'], ['exams', '/exams'], ['notifications', '/notifications'], ['settings', '/settings'], ['bookmarks', '/bookmarks'],
];
for (const [name, path] of pages) {
  await page.goto(BASE + path);
  await page.waitForSelector('h1', { timeout: 15000 });
  if (name === 'dashboard' || name === 'progress') await page.waitForSelector('.recharts-surface', { timeout: 8000 }).catch(() => {});
  await shot(page, `${tag}-${name}`);
}
// quiz runner with feedback, then results
await page.goto(`${BASE}/subjects/mathematics/units/${mathUnit}?tab=quiz`);
await page.locator('form button[type=submit]').first().click();
await page.waitForURL(/\/attempts\//);
await page.locator('h2').first().waitFor();
await page.waitForTimeout(800);
await page.getByRole('radio').first().click();
await page.locator('[role=status]').first().waitFor({ timeout: 8000 });
await shot(page, `${tag}-quiz-feedback`, { full: false });
await page.goto(`${BASE}/resources/${res}`);
await page.waitForSelector('canvas', { timeout: 15000 });
await page.waitForTimeout(1200);
await shot(page, `${tag}-pdf`, { full: false });
await page.goto(`${BASE}/dashboard`);
await page.waitForLoadState('networkidle');
await page.keyboard.press('Control+k');
await page.getByRole('combobox').fill('osmosis');
await page.getByRole('option').first().waitFor({ timeout: 8000 });
await shot(page, `${tag}-search`, { full: false });
await context.close();

// --- phone ---------------------------------------------------------------
{
  const m = await session(true);
  await login(m.page, email, 'Passw0rd1');
  for (const [name, path] of [['dashboard', '/dashboard'], ['summary', `/subjects/mathematics/units/${mathUnit}?tab=summary`], ['subjects', '/subjects']]) {
    await m.page.goto(BASE + path);
    await m.page.waitForSelector('h1');
    if (name === 'dashboard') await m.page.waitForSelector('.recharts-surface', { timeout: 8000 }).catch(() => {});
    await shot(m.page, `${tag}-m-${name}`);
  }
  await m.context.close();
}
// --- admin ---------------------------------------------------------------
{
  const a = await session();
  await login(a.page, 'admin@zetora.test', 'Passw0rd!');
  for (const [name, path] of [['overview', '/admin'], ['subjects', '/admin/subjects'], ['questions', '/admin/questions'], ['analytics', '/admin/analytics'], ['editor', `/admin/summaries/${mathUnit}`], ['settings', '/admin/settings']]) {
    await a.page.goto(BASE + path);
    await a.page.waitForSelector('h1, .ProseMirror', { timeout: 15000 });
    await shot(a.page, `${tag}-admin-${name}`);
  }
  await a.context.close();
}
// --- public / auth -------------------------------------------------------
{
  const p = await session();
  for (const [name, path] of [['landing', '/'], ['login', '/login'], ['register', '/register'], ['about', '/about']]) {
    await p.page.goto(BASE + path);
    await p.page.waitForSelector('h1');
    await shot(p.page, `${tag}-${name}`);
  }
  await p.context.close();
}
await db.end();
await browser.close();
console.log('done', tag);
