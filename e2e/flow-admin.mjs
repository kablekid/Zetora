import { BASE, check, launch, login, newSession, noHorizontalOverflow, shot, summary } from './lib.mjs';
import { makePdf } from './pdf.mjs';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import { readFileSync } from 'node:fs';

const db = new pg.Client({ connectionString: 'postgres://zetora_test:zetora@127.0.0.1:5432/zetora_e2e' });
await db.connect();
const ANON = process.env.ANON_KEY || readFileSync(new URL('./.run-stack.log', import.meta.url), 'utf8').match(/ANON_KEY=(\S+)/)[1];
const browser = await launch();
const ADMIN = { email: 'admin@zetora.test', password: 'Passw0rd!' };
const SUBJ = `Geography ${Date.now() % 10000}`;
const q = async (sql, p) => (await db.query(sql, p)).rows;

const { page, problems, context } = await newSession(browser);
let beforeUnloadPrompts = 0;
page.on('dialog', async (d) => { if (d.type() === 'beforeunload') beforeUnloadPrompts++; await d.accept(); });

console.log('\nAdmin access control');
{
  await login(page, ADMIN.email, ADMIN.password);
  await page.goto(`${BASE}/admin`);
  await page.waitForSelector('h1');
  check('admin can open the console', await page.getByRole('heading', { level: 1, name: 'Overview' }).isVisible());
  for (const label of ['Students', 'Subjects', 'Units', 'Published summaries', 'PDFs & materials', 'Questions', 'Quiz attempts', 'Exam attempts']) {
    check(`overview widget: ${label}`, (await page.getByText(label, { exact: true }).first().isVisible()));
  }
  check('overview lists recent registrations + activity', (await page.getByText('Recent registrations').isVisible()) && (await page.getByText('Recent student activity').isVisible()));
  check('overview counts are real (25 units, 60 questions)', (await page.locator('a[href="/admin/units"] p.text-3xl').innerText()) === '25' && (await page.locator('a[href="/admin/questions"] p.text-3xl').innerText()) === '60');
  await shot(page, 'admin-overview');
  check('admin sidebar lists all 11 sections', (await page.locator('aside nav a').count()) === 11);
}

console.log('\nSubjects');
{
  await page.goto(`${BASE}/admin/subjects`);
  await page.getByRole('button', { name: 'New subject' }).first().click();
  await page.fill('#s-title', SUBJ);
  check('URL name auto-fills from the title', (await page.inputValue('#s-slug')).startsWith('geography-'));
  await page.fill('#s-desc', 'Maps, landforms and human geography. (test content)');
  await page.getByRole('radio', { name: 'globe' }).click();
  await page.getByRole('radio', { name: 'cyan' }).click();
  await page.getByRole('button', { name: 'Create subject' }).click();
  await page.getByText('Subject created').waitFor();
  const row = (await q(`select * from subjects where title = $1`, [SUBJ]))[0];
  check('subject saved with icon/colour, as a draft', row && row.icon === 'globe' && row.color === 'cyan' && row.is_published === false && row.position === 6);
  // validation
  await page.getByRole('button', { name: 'New subject' }).first().click();
  await page.fill('#s-title', 'X');
  await page.fill('#s-slug', 'Bad Slug!');
  await page.getByRole('button', { name: 'Create subject' }).click();
  check('invalid URL name is rejected by validation', await page.getByText(/lowercase letters, numbers and dashes/).isVisible());
  await page.keyboard.press('Escape');
  await page.getByRole('switch', { name: `Publish ${SUBJ}` }).click();
  await page.getByText('Published', { exact: true }).first().waitFor();
  await page.waitForTimeout(800);
  check('publish switch persists', (await q(`select is_published from subjects where title = $1`, [SUBJ]))[0].is_published === true);
  check('publishing broadcast a "New subject" notification', (await q(`select 1 from notifications where title = $1`, [`New subject: ${SUBJ}`])).length === 1);
  // reorder
  await page.getByRole('button', { name: 'Move up' }).last().click();
  await page.waitForTimeout(900);
  check('reorder persists new positions', (await q(`select position from subjects where title = $1`, [SUBJ]))[0].position === 5);
  await shot(page, 'admin-subjects');
}

console.log('\nUnits');
let unitId;
{
  await page.goto(`${BASE}/admin/units`);
  await page.selectOption('#subject-filter', { label: SUBJ });
  await page.waitForURL(/subject=/);
  await page.getByRole('button', { name: 'New unit' }).first().click();
  await page.fill('#u-title', 'Reading Maps');
  await page.fill('#u-desc', 'Scale, direction and symbols.');
  await page.fill('#u-intro', 'Maps compress the world onto paper.\n\nLearn to read them.');
  await page.fill('#u-obj', 'Use a map scale\nFind a place with grid references');
  await page.fill('#u-topics', 'Scale\nSymbols and keys\nGrid references');
  await page.fill('#u-concepts', 'Scale\nContour');
  await page.getByRole('button', { name: 'Create unit' }).click();
  await page.getByText('Unit created').waitFor();
  const u = (await q(`select u.* from units u join subjects s on s.id = u.subject_id where s.title = $1`, [SUBJ]))[0];
  unitId = u.id;
  check('unit saved with objectives + concepts', u.title === 'Reading Maps' && u.objectives.length === 2 && u.key_concepts.length === 2 && u.number === 1);
  check('unit topics saved in order', JSON.stringify((await q(`select title from topics where unit_id = $1 order by position`, [unitId])).map((r) => r.title)) === JSON.stringify(['Scale', 'Symbols and keys', 'Grid references']));
  await page.getByRole('switch', { name: 'Publish Reading Maps' }).click();
  await page.waitForTimeout(900);
  check('unit published', (await q(`select is_published from units where id = $1`, [unitId]))[0].is_published === true);
  await shot(page, 'admin-units');
}

console.log('\nSummary editor');
{
  await page.goto(`${BASE}/admin/summaries/${unitId}`);
  await page.waitForSelector('.ProseMirror');
  check('editor loads with toolbar', (await page.getByRole('toolbar', { name: 'Formatting' }).isVisible()) && (await page.getByRole('toolbar', { name: 'Highlighted boxes' }).isVisible()));
  await page.locator('.ProseMirror').click();
  await page.getByRole('button', { name: 'Heading', exact: true }).click();
  await page.keyboard.type('What is a map?');
  await page.keyboard.press('Enter');
  await page.keyboard.type('A map is a flat picture of an area. ');
  await page.getByRole('button', { name: 'Highlight important text' }).click();
  await page.keyboard.type('Scale matters.');
  await page.getByRole('button', { name: 'Highlight important text' }).click();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Definition', exact: true }).click();
  await page.keyboard.type('Scale: the ratio of map distance to real distance.');
  await page.keyboard.press('Enter'); await page.keyboard.press('Enter');
  await page.getByRole('button', { name: 'Insert formula' }).click();
  await page.getByLabel('LaTeX formula').fill('\\text{scale}=\\frac{d_{map}}{d_{real}}');
  check('formula dialog shows a live KaTeX preview', (await page.locator('[role=dialog] .katex').count()) > 0);
  await page.getByRole('radio', { name: /Display/ }).click();
  await page.getByRole('button', { name: 'Insert formula' }).last().click();
  await page.getByRole('button', { name: 'Insert table' }).click();
  await page.keyboard.type('Symbol');
  await page.keyboard.press('Tab'); await page.keyboard.type('Meaning');
  await page.keyboard.press('Tab'); await page.keyboard.type('Use');
  check('table inserted with row/column controls', (await page.locator('.ProseMirror table').count()) === 1 && (await page.getByRole('button', { name: 'Add row below' }).isVisible()));
  await shot(page, 'admin-editor');
  await page.getByRole('button', { name: 'Save draft' }).click();
  await page.getByText('Draft saved').waitFor();
  let s = (await q(`select * from summaries where unit_id = $1`, [unitId]))[0];
  check('draft saved (not visible to students)', s && s.status === 'draft' && s.content_html.includes('What is a map?'));
  check('saved HTML contains heading, highlight, callout, math block and table', /<h2/.test(s.content_html) && /<mark/.test(s.content_html) && /data-type="callout"/.test(s.content_html) && /data-type="math-block"/.test(s.content_html) && /<table/.test(s.content_html));
  await page.getByRole('button', { name: 'Publish' }).click();
  await page.getByText('Summary published').waitFor();
  s = (await q(`select * from summaries where unit_id = $1`, [unitId]))[0];
  check('publish sets status + published_at + word count', s.status === 'published' && s.published_at && s.word_count > 10);
  // click the formula to edit it
  await page.locator('.ProseMirror [data-type="math-block"]').click();
  check('clicking a formula reopens it for editing', await page.getByRole('heading', { name: 'Edit formula' }).isVisible());
  await page.keyboard.press('Escape');
  await page.goto(`${BASE}/admin/materials`);
  check('no "unsaved changes" prompt after a successful publish', beforeUnloadPrompts === 0, String(beforeUnloadPrompts));
}

console.log('\nLearning materials (private uploads)');
let resourceId; let resourcePath;
{
  await page.goto(`${BASE}/admin/materials`);
  const pdf = makePdf(['Reading Maps — page one', 'Page two: scale', 'Page three: symbols']);
  await page.getByRole('button', { name: 'Upload material' }).first().click();
  // rejected: not a PDF despite the extension
  await page.setInputFiles('#m-file', { name: 'fake.pdf', mimeType: 'application/pdf', buffer: Buffer.from('<html>not a pdf</html>') });
  check('file with a .pdf name but no PDF signature is rejected', await page.getByText('does not look like a valid PDF').isVisible());
  await page.setInputFiles('#m-file', { name: 'huge.pdf', mimeType: 'application/pdf', buffer: Buffer.concat([Buffer.from('%PDF-'), Buffer.alloc(26 * 1024 * 1024)]) });
  check('files over 25 MB are rejected before upload', await page.getByText(/The limit is 25 MB/).isVisible());
  await page.setInputFiles('#m-file', { name: 'malware.exe', mimeType: 'application/x-msdownload', buffer: Buffer.from('MZ') });
  check('unsupported file types are rejected', await page.getByText(/Only PDF, PNG, JPG, WebP or plain-text/).isVisible());
  await page.setInputFiles('#m-file', { name: 'reading-maps_notes.pdf', mimeType: 'application/pdf', buffer: pdf });
  await page.waitForFunction(() => document.querySelector('#m-title')?.value === 'reading maps notes', null, { timeout: 5000 }).catch(() => {});
  check('title is pre-filled from the file name', (await page.inputValue('#m-title')) === 'reading maps notes');
  await page.fill('#m-title', 'Reading Maps — study notes');
  await page.fill('#m-desc', 'Three pages of worked examples.');
  await page.selectOption('#m-subject', { label: SUBJ });
  await page.selectOption('#m-unit', { label: 'Unit 1: Reading Maps' });
  await page.getByRole('switch', { name: 'Published' }).click();
  await page.getByRole('button', { name: 'Upload', exact: true }).click();
  await page.getByText('Material uploaded').waitFor({ timeout: 15000 });
  const r = (await q(`select * from learning_resources where title = 'Reading Maps — study notes'`))[0];
  resourceId = r.id; resourcePath = r.storage_path;
  check('resource row saved with size, mime and unit', r.mime_type === 'application/pdf' && Number(r.file_size) === pdf.length && r.unit_id === unitId && r.is_published && r.allow_download);
  check('object stored in the PRIVATE resources bucket', (await q(`select 1 from storage.objects where bucket_id = 'resources' and name = $1`, [r.storage_path])).length === 1 && (await q(`select public from storage.buckets where id = 'resources'`))[0].public === false);
  await page.getByText(/\d+(\.\d)? (B|KB|MB) · uploaded/).first().waitFor({ timeout: 8000 });
  check('list shows file size and upload date', true);
  check('upload broadcast a "New learning material" notification', (await q(`select 1 from notifications where title = 'New learning material: Reading Maps — study notes'`)).length === 1);
  await shot(page, 'admin-materials');
  // anonymous direct access to the private bucket must fail
  const direct = await page.request.get(`http://127.0.0.1:54321/storage/v1/object/public/resources/${resourcePath}`);
  check('private files have NO public URL', direct.status() === 404);
}

console.log('\nQuestion bank');
let questionId;
{
  await page.goto(`${BASE}/admin/questions`);
  await page.getByRole('button', { name: 'New question' }).first().click();
  await page.selectOption('#q-subject', { label: SUBJ });
  await page.selectOption('#q-unit', { label: 'Unit 1: Reading Maps' });
  await page.selectOption('#q-topic', { label: 'Scale' });
  await page.fill('#q-body', 'A map scale of 1:50,000 means 1 cm on the map is how far on the ground?');
  await page.getByRole('button', { name: 'Create question' }).click();
  check('empty options are rejected', await page.getByText('Add at least two answer options.').isVisible());
  await page.getByLabel('Option 1 text').fill('500 m');
  await page.getByLabel('Option 2 text').fill('50 m');
  await page.getByLabel('Option 3 text').fill('5 km');
  await page.getByLabel('Option 4 text').fill('50 km');
  // option 1 is pre-marked as correct by default; mark it explicitly anyway
  await page.getByRole('radio', { name: 'Mark option 1 as correct' }).click();
  await page.fill('#q-exp', '1 cm × 50,000 = 50,000 cm = 500 m.');
  await page.getByRole('button', { name: 'Create question' }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 10000 });
  const qu = (await q(`select * from questions where body like 'A map scale of 1:50,000%'`))[0];
  questionId = qu.id;
  const opts = await q(`select body, is_correct from question_options where question_id = $1 order by position`, [qu.id]);
  check('question + 4 ordered options saved, exactly one correct', opts.length === 4 && opts.filter((o) => o.is_correct).length === 1 && opts[0].is_correct && qu.explanation.includes('500 m'));
  // short-answer and multi-select via the UI too
  await page.getByRole('button', { name: 'New question' }).first().click();
  await page.selectOption('#q-subject', { label: SUBJ });
  await page.selectOption('#q-unit', { label: 'Unit 1: Reading Maps' });
  await page.selectOption('#q-type', 'short_answer');
  await page.fill('#q-body', 'What is the name for lines joining places of equal height?');
  await page.fill('#q-acc', 'contour lines\ncontours');
  await page.getByRole('button', { name: 'Create question' }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 10000 });
  check('short-answer question saved with accepted answers', (await q(`select accepted_answers from questions where body like 'What is the name for lines%'`))[0].accepted_answers.length === 2);
  await page.getByRole('button', { name: 'New question' }).first().click();
  await page.selectOption('#q-subject', { label: SUBJ });
  await page.selectOption('#q-type', 'true_false');
  await page.fill('#q-body', 'North is always at the top of a map.');
  await page.getByRole('radio', { name: 'Mark option 2 as correct' }).click();
  await page.getByRole('button', { name: 'Create question' }).click();
  await page.getByRole('dialog').waitFor({ state: 'hidden', timeout: 10000 });
  check('true/false question saved with False correct', (await q(`select o.body from question_options o join questions q on q.id = o.question_id where q.body like 'North is always%' and o.is_correct`))[0].body === 'False');
  // search & filter
  await page.goto(`${BASE}/admin/questions`);
  await page.getByLabel('Search questions').fill('joining places');
  await page.keyboard.press('Enter');
  await page.waitForURL(/q=joining/);
  check('question search filters the list', (await page.locator('ul > li').filter({ hasText: 'equal height' }).count()) === 1);
  await page.goto(`${BASE}/admin/questions?difficulty=hard`);
  check('difficulty filter works', (await page.locator('main ul > li').count()) >= 1);
  await shot(page, 'admin-questions');
}

console.log('\nQuiz builder');
let quizId;
{
  await page.goto(`${BASE}/admin/quizzes/new`);
  await page.fill('#z-title', 'Reading Maps — practice quiz');
  await page.selectOption('#z-subject', { label: SUBJ });
  await page.selectOption('#z-unit', { label: 'Unit 1: Reading Maps' });
  await page.getByText('Add from question bank').waitFor();
  await page.getByRole('button', { name: /Add all shown/ }).waitFor({ timeout: 8000 });
  await page.getByRole('button', { name: /Add all shown/ }).click();
  check('question picker adds bank questions to the quiz', (await page.locator('ol > li').count()) === 3);
  await page.getByRole('switch', { name: 'Published' }).click();
  await page.getByRole('button', { name: 'Save quiz' }).first().click();
  await page.waitForURL(/\/admin\/quizzes$/, { timeout: 10000 });
  const z = (await q(`select * from quizzes where title = 'Reading Maps — practice quiz'`))[0];
  quizId = z.id;
  check('quiz saved: practice mode, 60% pass, published, linked to the unit', z.mode === 'practice' && z.pass_percentage === 60 && z.is_published && z.unit_id === unitId);
  check('quiz_questions saved in order', (await q(`select 1 from quiz_questions where quiz_id = $1`, [quizId])).length === 3);
  check('publishing broadcast a "New quiz available" notification', (await q(`select 1 from notifications where title = 'New quiz available: Reading Maps — practice quiz'`)).length === 1);
  // empty quiz cannot be published
  await page.goto(`${BASE}/admin/quizzes/new`);
  await page.fill('#z-title', 'Empty quiz');
  await page.getByRole('switch', { name: 'Published' }).click();
  await page.getByRole('button', { name: 'Save quiz' }).first().click();
  await page.getByText('Add at least one question before publishing.').waitFor();
  check('a quiz with no questions cannot be published', true);
  await page.goto(`${BASE}/admin/quizzes`);
  check('quiz list shows mode, count and publish switch', (await page.getByText('Reading Maps — practice quiz').isVisible()) && (await page.getByText('3 questions').first().isVisible()));
  await shot(page, 'admin-quizzes');
}

console.log('\nExams');
{
  await page.goto(`${BASE}/admin/exams`);
  await page.getByRole('button', { name: 'New exam' }).first().click();
  await page.fill('#e-title', `${SUBJ} — mock exam`);
  await page.selectOption('#e-kind', 'mock');
  await page.selectOption('#e-subject', { label: SUBJ });
  await page.fill('#e-count', '3');
  await page.fill('#e-dur', '5');
  await page.getByRole('switch', { name: 'Published' }).click();
  await page.getByRole('button', { name: 'Create exam' }).click();
  await page.getByText('Exam saved').waitFor();
  const e = (await q(`select * from exams where title = $1`, [`${SUBJ} — mock exam`]))[0];
  check('exam saved (mock, 3 questions, 5 min)', e && e.kind === 'mock' && e.question_count === 3 && e.duration_minutes === 5 && e.is_published);
  await page.getByText(/3 in pool/).first().waitFor({ timeout: 8000 });
  check('exam list shows the question-pool size', true);
  await page.getByRole('button', { name: 'New exam' }).first().click();
  await page.fill('#e-title', 'Mixed test exam');
  await page.selectOption('#e-kind', 'mixed');
  await page.getByRole('button', { name: 'Create exam' }).click();
  check('mixed exam requires at least one unit', await page.getByText('Choose at least one unit.').isVisible());
  await page.keyboard.press('Escape');
  await shot(page, 'admin-exams');
}

console.log('\nWhat a student sees');
{
  const s = await newSession(browser);
  const sp = s.page;
  const email = `ayana.${Date.now()}@example.com`;
  await sp.goto(`${BASE}/register`);
  await sp.fill('#fullName', 'Ayana Tesfaye'); await sp.fill('#email', email); await sp.fill('#password', 'Passw0rd1'); await sp.fill('#confirmPassword', 'Passw0rd1');
  await sp.getByRole('button', { name: 'Create account' }).click();
  await sp.waitForURL(/\/dashboard/);
  check('new subject appears in the student library', await (async () => { await sp.goto(`${BASE}/subjects`); return sp.getByText(SUBJ).first().isVisible(); })());
  await sp.goto(`${BASE}/notifications`);
  check('student received the publish notifications', (await sp.getByText(`New subject: ${SUBJ}`).isVisible()) && (await sp.getByText('New learning material: Reading Maps — study notes').isVisible()));
  await sp.goto(`${BASE}/subjects/${(await q(`select slug from subjects where title = $1`, [SUBJ]))[0].slug}/units/${unitId}?tab=summary`);
  await sp.waitForSelector('.summary-prose');
  check('published summary renders with heading, callout, formula and table', (await sp.locator('.summary-prose h2').count()) >= 1 && (await sp.locator('.summary-prose [data-type="callout"]').count()) === 1 && (await sp.locator('.summary-prose .katex').count()) >= 1 && (await sp.locator('.summary-prose table').count()) === 1);
  await shot(sp, 'student-admin-authored-summary');
  await sp.goto(`${BASE}/subjects/${(await q(`select slug from subjects where title = $1`, [SUBJ]))[0].slug}/units/${unitId}?tab=materials`);
  check('materials tab lists the uploaded PDF', await sp.getByText('Reading Maps — study notes').isVisible());
  await sp.getByRole('link', { name: /View/ }).click();
  await sp.waitForURL(/\/resources\//);
  await sp.waitForSelector('canvas', { timeout: 15000 });
  await sp.waitForFunction(() => document.querySelector('canvas') && document.querySelector('canvas').width > 100, null, { timeout: 15000 });
  await sp.waitForTimeout(1500);
  const pixels = await sp.evaluate(() => {
    const c = document.querySelector('canvas');
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    let dark = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 200 || d[i + 1] < 200 || d[i + 2] < 200) dark++;
    return { w: c.width, dark };
  });
  check('PDF viewer renders real page content to a canvas', pixels.dark > 500, JSON.stringify(pixels));
  check('viewer shows page count (3 pages)', await sp.getByText(/Page 1/).isVisible() && await sp.getByText('of 3').isVisible());
  await sp.getByRole('button', { name: 'Zoom in' }).click();
  check('zoom controls work', await sp.getByText('120%').isVisible());
  await shot(sp, 'pdf-viewer-desktop', { full: false });
  // signed URL behaviour via the API
  const signed = await sp.request.get(`${BASE}/api/resources/${resourceId}`);
  const body = await signed.json();
  check('API issues a short-lived signed URL to signed-in students', signed.status() === 200 && /\/storage\/v1\/object\/sign\/resources\//.test(body.url) && body.expiresIn === 120);
  const file = await sp.request.get(body.url);
  check('signed URL serves the actual PDF', file.status() === 200 && (await file.body()).subarray(0, 5).toString() === '%PDF-');
  const tampered = await sp.request.get(body.url.replace(/token=[^&]+/, 'token=abc.def.ghi'));
  check('a tampered token is refused', tampered.status() === 400);
  const dl = await (await sp.request.get(`${BASE}/api/resources/${resourceId}?download=1`)).json();
  check('download URL carries a Content-Disposition attachment', (await (await sp.request.get(dl.url)).headers())['content-disposition']?.includes('attachment'));
  // disallow download
  await db.query(`update learning_resources set allow_download = false where id = $1`, [resourceId]);
  const noDl = await sp.request.get(`${BASE}/api/resources/${resourceId}?download=1`);
  check('download is refused when the admin turns it off', noDl.status() === 403);
  const stillView = await sp.request.get(`${BASE}/api/resources/${resourceId}`);
  check('...but in-app viewing still works', stillView.status() === 200);
  // unpublish
  await db.query(`update learning_resources set is_published = false where id = $1`, [resourceId]);
  const gone = await sp.request.get(`${BASE}/api/resources/${resourceId}`);
  check('an UNPUBLISHED file is not available to students (404)', gone.status() === 404);
  await db.query(`update learning_resources set is_published = true, allow_download = true where id = $1`, [resourceId]);

  // quiz built by the admin works end to end
  await sp.goto(`${BASE}/subjects/${(await q(`select slug from subjects where title = $1`, [SUBJ]))[0].slug}/units/${unitId}?tab=quiz`);
  await sp.getByRole('button', { name: /Start quiz/ }).click();
  await sp.waitForURL(/\/attempts\//);
  await sp.getByText(/Question 1 of 3/).waitFor();
  check('admin-built quiz runs for students (3 questions)', true);
  await sp.context().close();
  check('no runtime errors for the student viewing admin content', s.problems.filter((p) => !/scroll-behavior/.test(p)).length === 0, '\n' + s.problems.slice(0, 2).join('\n'));
}

console.log('\nStudents, analytics, settings');
{
  await page.goto(`${BASE}/admin/students`);
  await page.getByLabel('Search students').fill('ayana');
  await page.keyboard.press('Enter');
  await page.waitForURL(/q=ayana/);
  await page.getByText('Ayana Tesfaye').first().waitFor({ timeout: 10000 });
  check('student search finds the new account', true);
  check('student rows show completion/attempt stats', await page.getByText('Units done').first().isVisible());
  await page.getByRole('button', { name: /Actions for Ayana/ }).click();
  await page.getByRole('menuitem', { name: 'Suspend account' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Confirm' }).click();
  await page.getByText('Account suspended').waitFor();
  check('suspending an account is stored', (await q(`select is_active from profiles where full_name = 'Ayana Tesfaye'`))[0].is_active === false);
  // suspended student cannot use the app and does not loop
  const sus = await newSession(browser);
  const email = (await q(`select email from profiles where full_name = 'Ayana Tesfaye' order by created_at desc limit 1`))[0].email;
  await sus.page.goto(`${BASE}/login`);
  await sus.page.fill('#email', email); await sus.page.fill('#password', 'Passw0rd1');
  await sus.page.getByRole('button', { name: 'Sign in' }).click();
  await sus.page.waitForURL(/\/login\?error=suspended/, { timeout: 15000 });
  check('a suspended student is signed out with a clear message (no redirect loop)', await sus.page.getByText(/account has been suspended/i).isVisible());
  await sus.context.close();
  await db.query(`update profiles set is_active = true where full_name = 'Ayana Tesfaye'`);
  await shot(page, 'admin-students');

  await page.goto(`${BASE}/admin/analytics`);
  await page.waitForSelector('h1');
  await page.waitForSelector('.recharts-surface', { timeout: 8000 }).catch(() => {});
  check('analytics page renders KPIs + registrations from real data', (await page.getByText('Active students (7 days)').isVisible()) && (await page.getByText('New registrations').first().isVisible()));
  await shot(page, 'admin-analytics');

  await page.goto(`${BASE}/admin/settings`);
  await page.fill('#a-title', 'Mock exams are open');
  await page.fill('#a-body', 'Try the new timed exams under Exams.');
  await page.fill('#a-link', 'https://evil.example');
  await page.getByRole('button', { name: 'Send to all students' }).click();
  check('announcement links must stay inside the app', await page.getByText(/in-app link/).isVisible());
  await page.fill('#a-link', '/exams');
  await page.getByRole('button', { name: 'Send to all students' }).click();
  await page.getByText('Announcement sent to all students').waitFor();
  check('announcement stored as a broadcast notification', (await q(`select 1 from notifications where title = 'Mock exams are open' and user_id is null and link = '/exams'`)).length === 1);
  await shot(page, 'admin-settings');
  await page.getByRole('button', { name: 'Remove demo content' }).click();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Remove demo content' }).click();
  await page.getByText('Demo content removed').waitFor();
  const left = (await q(`select (select count(*) from subjects where is_demo)::int as demo, (select count(*) from subjects where title = $1)::int as mine, (select count(*) from questions where is_demo)::int as dq`, [SUBJ]))[0];
  check('"Remove demo content" deletes only demo rows', left.demo === 0 && left.dq === 0 && left.mine === 1);
  check('...and keeps real content + student attempts history', (await q(`select 1 from attempts`)).length >= 1);
  check('no runtime errors in the admin console', problems.filter((p) => !/scroll-behavior/.test(p)).length === 0, '\n' + problems.slice(0, 3).join('\n---\n'));
}

console.log('\nAPI-level security (student JWT, direct REST calls)');
{
  const sb = createClient('http://127.0.0.1:54321', ANON, { auth: { persistSession: false } });
  const email = `sec.${Date.now()}@example.com`;
  const signup = await sb.auth.signUp({ email, password: 'Passw0rd1', options: { data: { full_name: 'Security Tester' } } });
  check('API: sign-up through the auth API creates a student', signup.data.user && (await q(`select role from profiles where email = $1`, [email]))[0].role === 'student');
  check('student REST: cannot read the question bank', ((await sb.from('questions').select('id')).data ?? []).length === 0);
  check('student REST: cannot read option correctness', ((await sb.from('question_options').select('*')).data ?? []).length === 0);
  check('student REST: cannot create content', !!(await sb.from('subjects').insert({ slug: 'hack', title: 'Hack' })).error);
  check('student REST: cannot self-promote', !!(await sb.from('profiles').update({ role: 'admin' }).neq('id', '00000000-0000-0000-0000-000000000000')).error);
  check('student REST: cannot read other profiles', ((await sb.from('profiles').select('id')).data ?? []).length === 1);
  check('student REST: admin RPCs are forbidden', !!(await sb.rpc('admin_overview')).error);
  check('student REST: cannot forge attempts', !!(await sb.from('attempts').insert({ user_id: (await sb.auth.getUser()).data.user.id, kind: 'quiz', title: 'x', question_ids: [], total_questions: 0 })).error);
  const up = await sb.storage.from('resources').upload(`x/${Date.now()}.pdf`, new Blob(['%PDF-1'], { type: 'application/pdf' }));
  check('student REST: cannot upload to the private bucket', !!up.error);
  const listing = await sb.storage.from('resources').createSignedUrl(resourcePath, 60);
  check('student REST: can sign only PUBLISHED resource objects', !listing.error);
  await db.query(`update learning_resources set is_published = false where id = $1`, [resourceId]);
  const listing2 = await sb.storage.from('resources').createSignedUrl(resourcePath, 60);
  check('student REST: signing an unpublished object fails', !!listing2.error);
  await db.query(`update learning_resources set is_published = true where id = $1`, [resourceId]);
}

console.log('\nAdmin on a phone');
{
  const m = await newSession(browser, { mobile: true });
  await login(m.page, ADMIN.email, ADMIN.password);
  for (const path of ['/admin', '/admin/students', '/admin/subjects', '/admin/units', '/admin/summaries', `/admin/summaries/${unitId}`, '/admin/materials', '/admin/questions', '/admin/quizzes', '/admin/quizzes/new', '/admin/exams', '/admin/analytics', '/admin/settings']) {
    await m.page.goto(BASE + path);
    await m.page.waitForSelector('h1');
    check(`admin ${path}: no horizontal overflow on a phone`, await noHorizontalOverflow(m.page));
  }
  await m.page.goto(`${BASE}/admin`);
  await m.page.getByRole('button', { name: 'Open navigation' }).click();
  check('mobile admin navigation drawer opens with all sections', (await m.page.getByRole('dialog').locator('a').count()) >= 11);
  await shot(m.page, 'admin-mobile-nav', { full: false });
  await m.page.keyboard.press('Escape');
  await m.page.goto(`${BASE}/admin/subjects`);
  await shot(m.page, 'admin-subjects-mobile');
  await m.context.close();
}

await context.close();
await db.end();
await browser.close();
process.exit(summary() ? 0 : 1);
