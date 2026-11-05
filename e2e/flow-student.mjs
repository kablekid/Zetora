import { BASE, check, launch, login, newSession, noHorizontalOverflow, shot, summary } from './lib.mjs';
import pg from 'pg';

const db = new pg.Client({ connectionString: 'postgres://zetora_test:zetora@127.0.0.1:5432/zetora_e2e' });
await db.connect();
const browser = await launch();
const email = `hana.${Date.now()}@example.com`;
const password = 'Passw0rd1';

/** Answer the question currently on screen (practice or exam mode). */
async function answerCurrent(page, { practice }) {
  if (await page.getByRole('radio').count()) {
    await page.getByRole('radio').first().click();
    if (practice) await page.locator('[role=status]').filter({ hasText: /Correct!|Not quite/ }).waitFor({ timeout: 8000 });
  } else if (await page.getByRole('checkbox').count()) {
    await page.getByRole('checkbox').nth(0).click();
    await page.getByRole('checkbox').nth(1).click();
    if (practice) {
      await page.getByRole('button', { name: 'Check answer' }).click();
      await page.locator('[role=status]').filter({ hasText: /Correct!|Not quite/ }).waitFor({ timeout: 8000 });
    }
  } else {
    await page.locator('#short').fill('7');
    if (practice) {
      await page.getByRole('button', { name: 'Check answer' }).click();
      await page.locator('[role=status]').filter({ hasText: /Correct!|Not quite/ }).waitFor({ timeout: 8000 });
    }
  }
}

async function finishQuiz(page, total, { practice }) {
  for (let i = 0; i < total; i++) {
    await answerCurrent(page, { practice });
    if (i < total - 1) await page.getByRole('button', { name: 'Next', exact: true }).click();
    else await page.getByRole('button', { name: /Submit (quiz|exam)/ }).click();
  }
  await page.getByRole('alertdialog').getByRole('button', { name: 'Submit now' }).click();
  await page.waitForURL(/\/results/, { timeout: 15000 });
}

console.log('\nRegistration & sign-in');
const { page, problems, context } = await newSession(browser);
{
  await page.goto(`${BASE}/register`);
  await page.fill('#fullName', 'Hana Bekele');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.fill('#confirmPassword', 'different1');
  await page.getByRole('button', { name: 'Create account' }).click();
  check('mismatched passwords are rejected client-side', await page.getByText('Passwords do not match.').isVisible());
  await page.fill('#password', 'short');
  await page.fill('#confirmPassword', 'short');
  await page.getByRole('button', { name: 'Create account' }).click();
  check('weak password is rejected', await page.getByText(/at least 8 characters|letter and one number/).first().isVisible());
  await page.fill('#password', password);
  await page.fill('#confirmPassword', password);
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  check('registration signs the student in and opens the dashboard', page.url().endsWith('/dashboard'));
  const prof = (await db.query(`select role, full_name from public.profiles where email = $1`, [email])).rows[0];
  check('profile row created as a student', prof?.role === 'student' && prof.full_name === 'Hana Bekele');
}

console.log('\nDashboard (new student)');
{
  await page.waitForSelector('h1');
  check('personalised greeting uses first name', /Hana/.test(await page.locator('h1').first().innerText()));
  check('new-student welcome copy', await page.getByText(/pick a subject and open your first unit/i).isVisible());
  check('"Start your first unit" call to action', await page.getByText('Start your first unit').isVisible());
  check('empty chart states are shown', await page.getByText('Complete a quiz to see your scores here.').isVisible());
  check('my-subjects widget lists the 5 subjects', (await page.locator('a[href^="/subjects/"]').filter({ hasText: /units/ }).count()) >= 5);
  check('unread notification badge shows the welcome announcement', await page.getByRole('link', { name: /Notifications, 1 unread/ }).first().isVisible());
  await shot(page, 'dashboard-new-desktop');
}

console.log('\nSubject library');
{
  await page.goto(`${BASE}/subjects`);
  check('five subject cards', (await page.locator('a[href^="/subjects/"]').filter({ hasText: /Explore subject/ }).count()) === 5);
  await page.getByRole('textbox', { name: 'Search subjects' }).fill('phys');
  check('search filters to Physics', (await page.locator('a[href^="/subjects/"]').filter({ hasText: /Explore subject/ }).count()) === 1);
  await page.getByRole('textbox', { name: 'Search subjects' }).fill('zzzz');
  check('empty search state shown', await page.getByText('No subjects match').isVisible());
  await page.getByRole('button', { name: 'Clear filters' }).click();
  await page.getByRole('button', { name: /Completed/ }).click();
  check('"Completed" filter is empty for a new student', await page.getByText('No subjects match').isVisible());
  await page.getByRole('button', { name: /^All/ }).click();
  await shot(page, 'subjects-desktop');
}

console.log('\nSubject → unit → summary');
let mathUnitUrl;
{
  await page.goto(`${BASE}/subjects/mathematics`);
  check('subject page lists 5 units', (await page.locator('main ol.space-y-3 > li').count()) === 5);
  check('unit rows show availability (summary + quiz)', (await page.getByText('Summary').first().isVisible()) && (await page.getByText('Quiz').first().isVisible()));
  await shot(page, 'subject-desktop');
  await page.getByRole('link', { name: /Start Unit 1/ }).click();
  await page.waitForURL(/\/units\//);
  mathUnitUrl = page.url().split('?')[0];
  check('unit page title', await page.getByRole('heading', { level: 1, name: 'Functions and Graphs' }).isVisible());
  check('overview shows objectives + key topics + concepts', (await page.getByText('Learning objectives').isVisible()) && (await page.getByText('Key topics').isVisible()) && (await page.getByText('Important concepts').isVisible()));
  await shot(page, 'unit-overview-desktop');

  await page.getByRole('link', { name: /^Summary/ }).first().click();
  await page.waitForURL(/tab=summary/);
  await page.waitForSelector('.summary-prose');
  check('summary renders KaTeX formulas', (await page.locator('.summary-prose .katex').count()) > 5);
  check('summary renders callout blocks', (await page.locator('.summary-prose [data-type="callout"]').count()) >= 4);
  check('summary tables are scroll-wrapped', (await page.locator('.summary-prose .table-scroll table').count()) >= 1);
  check('table of contents lists sections', (await page.locator('nav[aria-label="On this page"] a').count()) >= 4);
  check('reading progress bar present', await page.getByRole('progressbar', { name: 'Reading progress' }).count() === 1);
  await shot(page, 'summary-desktop');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(3500);
  const rp = (await db.query(`select reading_progress, status from public.student_progress sp join public.profiles p on p.id = sp.user_id where p.email = $1`, [email])).rows[0];
  check('scrolling saves reading progress to the database', rp && rp.reading_progress >= 50, JSON.stringify(rp));
  const read = (await db.query(`select count(*)::int n from public.activity_log l join public.profiles p on p.id = l.user_id where p.email = $1 and l.kind in ('unit_opened','summary_read')`, [email])).rows[0].n;
  check('unit opened + summary read are logged', read >= 2);

  await page.getByRole('button', { name: 'Bookmark', exact: true }).click();
  await page.getByText('Saved to your bookmarks').waitFor();
  await page.getByRole('button', { name: 'Mark as completed' }).last().click();
  await page.getByText(/marked as completed/i).waitFor();
  const st = (await db.query(`select status, reading_progress from public.student_progress sp join public.profiles p on p.id = sp.user_id where p.email = $1`, [email])).rows[0];
  check('mark-as-completed persists (100%)', st.status === 'completed' && st.reading_progress === 100);
  check('bookmark persists', (await db.query(`select 1 from public.bookmarks b join public.profiles p on p.id = b.user_id where p.email = $1`, [email])).rowCount === 1);

  await page.goto(`${mathUnitUrl}?tab=materials`);
  check('materials tab empty state', await page.getByText('No learning materials yet').isVisible());
  await page.goto(`${mathUnitUrl}`);
  await page.getByRole('link', { name: /Next unit/ }).click();
  await page.getByRole('heading', { level: 1, name: 'Limits and Continuity' }).waitFor();
  check('next-unit navigation works', true);
  await page.goto(`${BASE}/subjects/mathematics/units/${(await db.query(`select id from units where title = 'Differentiation'`)).rows[0].id}?tab=summary`);
  check('unit without a summary shows "coming soon"', await page.getByText('Summary coming soon').isVisible());
  await page.goto(`${BASE}/bookmarks`);
  check('bookmarks page lists the saved unit', await page.getByText('Unit 1: Functions and Graphs').isVisible());
}

console.log('\nPractice quiz (instant feedback)');
let firstAttemptUrl;
{
  await page.goto(`${mathUnitUrl}?tab=quiz`);
  await page.getByText('Functions and Graphs — practice quiz').waitFor();
  check('quiz tab lists the practice quiz', true);
  await page.getByRole('button', { name: /Start quiz/ }).click();
  await page.waitForURL(/\/attempts\//);
  firstAttemptUrl = page.url();
  await page.getByText(/Question 1 of 6/).waitFor();
  check('quiz runner shows question 1 of 6', true);
  await page.waitForSelector('h2 .katex', { timeout: 5000 }).catch(() => {});
  check('math in questions is rendered', (await page.locator('h2 .katex').count()) > 0);
  check('practice mode has no timer', (await page.getByRole('timer').count()) === 0);
  await shot(page, 'quiz-question-desktop');
  await page.getByRole('radio').first().click();
  await page.locator('[role=status]').filter({ hasText: /Correct!|Not quite/ }).waitFor();
  check('instant feedback + explanation appear after answering', await page.getByText(/Correct!|Not quite/).first().isVisible());
  await shot(page, 'quiz-feedback-desktop');
  await page.reload();
  await page.getByText(/Question 2 of 6 · 1 answered/).waitFor({ timeout: 8000 });
  check('refreshing resumes the same attempt at the first unanswered question', true);
  await page.getByRole('button', { name: 'Previous' }).click();
  await page.locator('[role=status]').filter({ hasText: /Correct!|Not quite/ }).waitFor({ timeout: 8000 });
  check('the earlier checked answer + feedback survived the refresh', true);
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  for (let i = 1; i < 6; i++) {
    await answerCurrent(page, { practice: true });
    if (i < 5) await page.getByRole('button', { name: 'Next', exact: true }).click();
    else await page.getByRole('button', { name: /Submit quiz/ }).click();
  }
  check('submit asks for confirmation', await page.getByRole('alertdialog').isVisible());
  await shot(page, 'quiz-submit-confirm');
  await page.getByRole('alertdialog').getByRole('button', { name: 'Submit now' }).click();
  await page.waitForURL(/\/results/, { timeout: 15000 });
  check('results page shows a score', await page.getByText(/^\d\/6$/).first().isVisible());
  check('results show correct/incorrect/time stats', (await page.locator('dt', { hasText: /^\s*Correct\s*$/ }).isVisible()) && (await page.locator('dt', { hasText: 'Time taken' }).isVisible()));
  check('results include the answer review with explanations', (await page.getByText('Explanation.').count()) >= 3);
  await shot(page, 'results-desktop');
  await page.getByRole('button', { name: /^Incorrect/ }).click();
  check('review filter works', true);
  const att = (await db.query(`select status, score, total_questions from public.attempts a join public.profiles p on p.id = a.user_id where p.email = $1`, [email])).rows[0];
  check('attempt stored in the database, graded server-side', att.status === 'submitted' && att.total_questions === 6 && att.score >= 0);
  await page.goto(firstAttemptUrl);
  await page.waitForURL(/\/results/);
  check('re-opening a finished attempt goes to its results', true);
  await page.getByRole('button', { name: /Try again/ }).click();
  await page.waitForURL(/\/attempts\/(?!.*results)/);
  check('"Try again" starts a fresh attempt', page.url() !== firstAttemptUrl && (await page.getByText('Question 1 of 6').isVisible()));
}

console.log('\nTimed quiz (answers hidden until submit)');
{
  const limitsId = (await db.query(`select id from units where title = 'Limits and Continuity'`)).rows[0].id;
  await page.goto(`${BASE}/subjects/mathematics/units/${limitsId}?tab=quiz`);
  await page.getByRole('button', { name: /Start quiz/ }).click();
  await page.waitForURL(/\/attempts\//);
  await page.getByRole('timer').waitFor();
  const timerBefore = await page.getByRole('timer').innerText();
  check('timed quiz shows a countdown starting near 10:00', /^(09:5\d|10:00)$/.test(timerBefore.trim()), timerBefore);
  await answerCurrent(page, { practice: false });
  await page.waitForTimeout(900);
  check('no feedback is shown before submitting in exam mode', (await page.getByText(/Correct!|Not quite/).count()) === 0);
  await page.waitForTimeout(2200);
  await page.reload();
  await page.getByRole('timer').waitFor();
  const timerAfter = await page.getByRole('timer').innerText();
  const secs = (t) => { const [m, s2] = t.trim().split(':').map(Number); return m * 60 + s2; };
  check('reloading does NOT reset the timer', secs(timerAfter) < secs(timerBefore), `${timerBefore} -> ${timerAfter}`);
  // answered Q1 is restored; finish the rest (resume lands on Q2)
  await page.getByText(/Question 2 of 6/).waitFor();
  for (let i = 1; i < 6; i++) {
    await answerCurrent(page, { practice: false });
    if (i < 5) await page.getByRole('button', { name: 'Next', exact: true }).click();
    else await page.getByRole('button', { name: /Submit quiz/ }).click();
  }
  await page.getByRole('alertdialog').getByText(/answered every question|unanswered/).waitFor();
  await page.getByRole('alertdialog').getByRole('button', { name: 'Submit now' }).click();
  await page.waitForURL(/\/results/, { timeout: 15000 });
  await page.getByText('Explanation.').first().waitFor();
  check('timed quiz results reveal answers + explanations only after submit', true);
}

console.log('\nDashboard with real data');
{
  await page.goto(`${BASE}/dashboard`);
  await page.waitForSelector('h1');
  check('overall progress ring reflects 1 of 25 units (4%)', (await page.getByRole('img', { name: /Overall learning completion: 4%/ }).count()) === 1);
  await page.waitForSelector('.recharts-surface', { timeout: 8000 });
  check('score-trend chart renders (SVG)', (await page.locator('.recharts-surface').count()) >= 2);
  check('recent activity lists events', (await page.getByText(/Finished “/).count()) >= 1);
  check('recommended next steps list units', (await page.getByText('Recommended next steps').isVisible()));
  check('streak shows 1-day streak', await page.getByText(/1-day streak/).isVisible());
  check('Mathematics shows 20% completion', await page.locator('a[href="/subjects/mathematics"]').filter({ hasText: '20%' }).first().isVisible());
  await shot(page, 'dashboard-active-desktop');
}

console.log('\nProgress page');
{
  await page.goto(`${BASE}/progress`);
  await page.waitForSelector('h1');
  check('progress page shows completion tiles', await page.getByText('Units completed').first().isVisible());
  await page.waitForSelector('.recharts-surface', { timeout: 8000 });
  check('progress page charts render', (await page.locator('.recharts-surface').count()) >= 2);
  check('recent results table lists the quiz attempts', (await page.locator('table tbody tr').count()) >= 2);
  await page.getByRole('button', { name: 'Table' }).first().click();
  check('chart table view toggle works (accessible alternative)', (await page.locator('table th', { hasText: 'Score' }).count()) >= 1);
  await shot(page, 'progress-desktop');
}

console.log('\nSearch');
{
  await page.goto(`${BASE}/dashboard`);
  await page.waitForLoadState('networkidle');
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox', { name: 'Search' }).fill('osmosis');
  await page.getByRole('option').first().waitFor({ timeout: 8000 });
  check('keyboard shortcut opens search and finds results', (await page.getByRole('option').count()) >= 1);
  check('result shows subject context', await page.getByRole('option').first().getByText(/Biology · Unit/).isVisible());
  await shot(page, 'search-palette', { full: false });
  await page.keyboard.press('Enter');
  await page.waitForURL(/\/subjects\/biology/, { timeout: 10000 });
  check('Enter opens the top result', true);
  await page.goto(`${BASE}/search?q=derivative`);
  await page.getByRole('heading', { name: /Units|Topics|Summaries/ }).first().waitFor({ timeout: 10000 });
  check('full search page returns grouped results', true);
  await page.goto(`${BASE}/search?q=%25%25`);
  await page.getByText(/No results/).waitFor({ timeout: 10000 });
  check('wildcard-only query finds nothing', true);
}

console.log('\nNotifications');
{
  await page.goto(`${BASE}/notifications`);
  check('welcome announcement is listed as unread', await page.getByText('Welcome to Zetora').isVisible());
  await page.getByRole('button', { name: /Mark all as read/ }).click();
  await page.waitForTimeout(1200);
  const unread = (await db.query(`select count(*)::int n from public.notification_reads r join public.profiles p on p.id = r.user_id where p.email = $1`, [email])).rows[0].n;
  check('marking read is stored per user', unread >= 1);
  await page.goto(`${BASE}/dashboard`);
  check('badge disappears once everything is read', (await page.getByRole('link', { name: /Notifications, \d+ unread/ }).count()) === 0);
}

console.log('\nSettings & avatar');
{
  await page.goto(`${BASE}/settings`);
  await page.fill('#school', 'Adama Preparatory');
  await page.fill('#location', 'Adama');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.getByText('Profile updated').waitFor();
  const prof = (await db.query(`select school, location from public.profiles where email = $1`, [email])).rows[0];
  check('profile edits are saved', prof.school === 'Adama Preparatory' && prof.location === 'Adama');
  // generate a PNG in-page and upload it through the file input
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mNkYPhfz0AEYBxVSF+FAP5FDvcfRYWgAAAAAElFTkSuQmCC', 'base64');
  await page.setInputFiles('input[aria-label="Profile picture file"]', { name: 'me.png', mimeType: 'image/png', buffer: png });
  await page.getByText('Profile picture updated').first().waitFor({ timeout: 15000 });
  const av = (await db.query(`select avatar_url from public.profiles where email = $1`, [email])).rows[0].avatar_url;
  check('avatar uploaded to storage and saved on the profile', /\/storage\/v1\/object\/public\/media\/avatars\//.test(av ?? ''), av);
  const head = await page.request.get(av);
  check('avatar is publicly readable from the media bucket', head.status() === 200);
  await shot(page, 'settings-desktop');
}

console.log('\nExams (server-side timer)');
{
  await page.goto(`${BASE}/exams`);
  check('exam list shows subject, mock and mixed exams', (await page.getByRole('button', { name: /Start exam/ }).count()) >= 5);
  const card = page.locator('div', { has: page.getByRole('heading', { name: 'Mathematics — mock exam' }) }).last();
  await card.getByRole('button', { name: /Start exam/ }).click();
  await page.waitForURL(/\/attempts\//);
  await page.getByRole('timer').waitFor();
  const examUrl = page.url();
  const t1 = await page.getByRole('timer').innerText();
  check('mock exam runs 15 minutes with 10 questions', /^(14:5\d|15:00)$/.test(t1.trim()) && (await page.getByText(/Question 1 of 10/).isVisible()), t1);
  await answerCurrent(page, { practice: false }); // exam questions are random: any type can come first
  await page.waitForTimeout(3200);
  await page.reload();
  await page.getByRole('timer').waitFor();
  const t2 = await page.getByRole('timer').innerText();
  const toSec = (t) => { const [m, s2] = t.trim().split(':').map(Number); return m * 60 + s2; };
  check('refreshing mid-exam does not restart the clock', toSec(t2) < toSec(t1), `${t1} -> ${t2}`);
  await page.goto(`${BASE}/exams`);
  check('exam list offers "Resume exam" for the running attempt', await page.getByRole('button', { name: /Resume exam/ }).isVisible());
  // fast-forward the deadline in the DB (as if the student walked away)
  await db.query(`update public.attempts a set expires_at = now() - interval '2 minutes', started_at = now() - interval '17 minutes' from public.profiles p where p.id = a.user_id and p.email = $1 and a.status = 'in_progress'`, [email]);
  await page.goto(examUrl);
  await page.waitForURL(/\/results/, { timeout: 15000 });
  check('opening an expired exam auto-submits it and shows results', true);
  check('results flag the timeout', await page.getByText('Timed out').first().isVisible());
  await page.goto(`${BASE}/exams`);
  check('exam history lists the attempt', (await page.locator('table tbody tr').count()) >= 1);
  await shot(page, 'exams-desktop');
}

console.log('\nSign out / sign in');
{
  await page.goto(`${BASE}/dashboard`);
  await page.getByRole('button', { name: 'Open profile menu' }).click();
  await page.getByRole('menuitem', { name: 'Sign out' }).click();
  await page.waitForURL(`${BASE}/`);
  await page.goto(`${BASE}/dashboard`);
  check('after sign-out protected pages redirect to login', page.url().includes('/login'));
  await page.fill('#email', email);
  await page.fill('#password', 'WrongPass1');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByText('Incorrect email or password.').waitFor();
  check('wrong password shows a friendly error', true);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/dashboard/);
  await page.getByRole('img', { name: /Overall learning completion: 4%/ }).waitFor({ timeout: 10000 });
  check('signing back in works and keeps the student’s progress', true);
  await page.reload();
  check('session persists across reloads', page.url().endsWith('/dashboard'));
  await page.goto(`${BASE}/admin`);
  await page.waitForURL(/\/dashboard/);
  check('a student can NOT open the admin console', true);
  check('no runtime errors during the student journey', problems.filter((p) => !/favicon|Download the React DevTools|scroll-behavior/.test(p)).length === 0, '\n' + problems.slice(0, 3).join('\n---\n'));
}
await context.close();

console.log('\nPhone layouts');
{
  const m = await newSession(browser, { mobile: true });
  const mp = m.page;
  await login(mp, email, password);
  const pages = [
    ['dashboard', '/dashboard'], ['subjects', '/subjects'], ['subject', '/subjects/mathematics'], ['progress', '/progress'],
    ['exams', '/exams'], ['bookmarks', '/bookmarks'], ['notifications', '/notifications'], ['settings', '/settings'],
  ];
  for (const [name, path] of pages) {
    await mp.goto(BASE + path);
    await mp.waitForSelector('h1');
    check(`${name}: no horizontal overflow on a phone`, await noHorizontalOverflow(mp));
    await shot(mp, `${name}-mobile`);
  }
  check('bottom navigation is visible on phones', await mp.getByRole('navigation', { name: 'Primary' }).isVisible());
  const unitId = (await db.query(`select id from units where title = 'Functions and Graphs'`)).rows[0].id;
  await mp.goto(`${BASE}/subjects/mathematics/units/${unitId}?tab=summary`);
  await mp.waitForSelector('.summary-prose');
  check('summary: no horizontal overflow on a phone', await noHorizontalOverflow(mp));
  await shot(mp, 'summary-mobile');
  await mp.goto(`${BASE}/subjects/mathematics/units/${unitId}?tab=quiz`);
  await mp.getByRole('button', { name: /Start quiz|Try again|Resume quiz/ }).click();
  await mp.waitForURL(/\/attempts\//);
  await mp.getByText(/Question \d of 6/).waitFor();
  check('quiz runner: no horizontal overflow on a phone', await noHorizontalOverflow(mp));
  const box = await mp.getByRole('radio').first().boundingBox();
  check('answer options are comfortable touch targets (≥ 48px tall)', box && box.height >= 48, JSON.stringify(box));
  // The runner's Next button must really be tappable (not covered by the bottom navigation).
  const nextBtn = mp.getByRole('button', { name: 'Next', exact: true });
  const nb = await nextBtn.boundingBox();
  const topEl = await mp.evaluate(({ x, y }) => { const el = document.elementFromPoint(x, y); return el?.closest('button')?.textContent?.trim() ?? el?.tagName; }, { x: nb.x + nb.width / 2, y: nb.y + nb.height / 2 });
  check('quiz runner: Next button is on top and tappable on a phone', /Next/.test(String(topEl)), String(topEl));
  check('quiz runner: app bottom navigation steps aside (focus mode)', (await mp.getByRole('navigation', { name: 'Primary' }).count()) === 0);
  await nextBtn.tap();
  await mp.getByText(/Question 2 of 6/).waitFor();
  check('quiz runner: tapping Next moves to question 2 on a phone', true);
  await shot(mp, 'quiz-mobile', { full: false });
  check('no runtime errors on phone layouts', m.problems.filter((p) => !/scroll-behavior/.test(p)).length === 0, JSON.stringify(m.problems.slice(0, 5)));
  await m.context.close();
}

await db.end();
await browser.close();
process.exit(summary() ? 0 : 1);
