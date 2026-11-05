// Amharic UI + Light/Dark/System theme, end to end.
import { BASE, check, launch, newSession, noHorizontalOverflow, shot, summary } from './lib.mjs';
import pg from 'pg';

const db = new pg.Client({ connectionString: 'postgres://zetora_test:zetora@127.0.0.1:5432/zetora_e2e' });
await db.connect();
const browser = await launch();
const ETH = /[ሀ-፿]/;
const lang = (page) => page.evaluate(() => document.documentElement.lang);
const isDark = (page) => page.evaluate(() => document.documentElement.classList.contains('dark'));
const body = (page) => page.locator('body').innerText();
/** Streaming SSR can land after `load`; wait for the text instead of racing it. */
const has = (page, needle) => page.waitForFunction((n) => document.body.innerText.includes(n), needle, { timeout: 10000 }).then(() => true, () => false);
const cookie = async (ctx, name) => (await ctx.cookies()).find((c) => c.name === name)?.value;
const email = `selam.${Date.now()}@example.com`;
const password = 'Passw0rd1';
const allProblems = [];

async function setLocaleCookie(context, value) {
  await context.addCookies([{ name: 'zetora-locale', value, url: BASE }]);
}

console.log('\nLanguage detection and switching');
{
  // 1. Accept-Language: am-ET selects Amharic without any cookie
  const { page, context, problems } = await newSession(browser, { locale: 'am-ET' });
  await page.goto(BASE);
  check('Amharic browsers get <html lang="am">', (await lang(page)) === 'am');
  check('landing hero is in Amharic', /የትምህርት ልቀት ጉዞዎ/.test(await body(page)));
  check('document title is Amharic', ETH.test(await page.title()));
  check('tagline keeps the brand name in Latin', /Zetora/.test(await body(page)));
  check('Ethiopic font is loaded for Amharic text', await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].some((f) => /Ethiopic/i.test(f.family) && f.status === 'loaded'); }));
  check('no horizontal overflow on the Amharic landing page (desktop)', await noHorizontalOverflow(page));
  await shot(page, 'i18n-landing-am');
  allProblems.push(...problems);
  await context.close();
}
{
  // 2. English by default, then switch with the header control
  const { page, context, problems } = await newSession(browser, { locale: 'en-US' });
  await page.goto(BASE);
  check('English by default', (await lang(page)) === 'en' && /Learn\.? Practice\.? Achieve/i.test(await body(page)));
  await page.getByRole('button', { name: 'Language' }).first().click();
  await page.getByRole('menuitem', { name: 'አማርኛ' }).click();
  await page.waitForFunction(() => document.documentElement.lang === 'am', null, { timeout: 8000 });
  check('language switcher flips the page to Amharic', /የትምህርት ልቀት ጉዞዎ/.test(await body(page)));
  check('the choice is stored in the zetora-locale cookie', (await cookie(context, 'zetora-locale')) === 'am');
  await page.reload();
  check('the choice survives a reload', (await lang(page)) === 'am');
  await page.goto(`${BASE}/login`);
  check('login page is Amharic', /እንኳን ደህና መጡ/.test(await body(page)));
  await page.getByRole('button', { name: 'ቋንቋ' }).first().click();
  await page.getByRole('menuitem', { name: 'English' }).click();
  await page.waitForFunction(() => document.documentElement.lang === 'en', null, { timeout: 8000 });
  check('switching back to English works', /Welcome back/i.test(await body(page)) || /Sign in/i.test(await body(page)));
  allProblems.push(...problems);
  await context.close();
}

console.log('\nRegistration, validation and errors in Amharic');
const { page, context, problems } = await newSession(browser, { locale: 'am-ET' });
{
  await page.goto(`${BASE}/register`);
  check('register form labels are Amharic', (await page.locator('label[for=fullName]').innerText()).includes('ሙሉ ስም'));
  await page.fill('#fullName', 'ሰላም ተስፋዬ');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.fill('#confirmPassword', 'different1');
  await page.locator('form button[type=submit]').click();
  check('validation messages are translated', await page.getByText('የይለፍ ቃሎቹ አይመሳሰሉም።').isVisible());
  await page.fill('#password', 'short');
  await page.fill('#confirmPassword', 'short');
  await page.locator('form button[type=submit]').click();
  check('weak-password message is translated', await page.getByText(/ቢያንስ 8 ቁምፊዎችን ይጠቀሙ።|ቢያንስ አንድ ፊደልና አንድ ቁጥር/).first().isVisible());
  await page.fill('#password', password);
  await page.fill('#confirmPassword', password);
  await page.locator('form button[type=submit]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  const prof = (await db.query(`select locale, full_name from public.profiles where email = $1`, [email])).rows[0];
  check('the account is created with the language it registered in', prof?.locale === 'am', JSON.stringify(prof));
  check('Ethiopic names are stored intact', prof?.full_name === 'ሰላም ተስፋዬ');
}

console.log('\nStudent app in Amharic');
{
  check('dashboard is Amharic', (await lang(page)) === 'am' && /እንደምን (አደሩ|ዋሉ|አመሹ)/.test(await page.locator('h1').first().innerText()));
  check('greeting uses the first name', (await page.locator('h1').first().innerText()).includes('ሰላም'));
  const nav = await page.locator('aside nav, nav').first().innerText();
  check('navigation labels are Amharic', /ትምህርቶች/.test(nav) && /ፈተናዎች/.test(nav));
  check('welcome copy for a new learner', /ወደ Zetora እንኳን በደህና መጡ/.test(await body(page)));
  check('no untranslated English headings on the dashboard', !/Overall progress|Recent activity|Continue learning/.test(await body(page)));
  await shot(page, 'i18n-dashboard-am');

  await page.goto(`${BASE}/subjects`);
  check('subject library is Amharic', /ትምህርቶች/.test(await page.locator('h1').first().innerText()));
  await page.getByRole('link', { name: /Mathematics/ }).first().click();
  await page.waitForURL(/\/subjects\/mathematics/);
  check('subject page: stats and progress labels are Amharic', /ጠቅላላ እድገት/.test(await body(page)));
  check('plural counts use Amharic nouns', /\d+ ምዕራፎች?/.test(await body(page)));
  await page.getByRole('link', { name: /Functions and Graphs/ }).first().click();
  await page.waitForURL(/\/units\//);
  const tabs = await page.getByRole('navigation', { name: 'የምዕራፉ ክፍሎች' }).innerText();
  check('unit tabs are Amharic', /አጠቃላይ እይታ/.test(tabs) && /ማጠቃለያ/.test(tabs) && /የልምምድ ኩዊዝ/.test(tabs));
  check('overview sections are Amharic', /የመማር ዓላማዎች/.test(await body(page)));
  check('course content stays in its authored language', /Functions and Graphs/.test(await body(page)));
  await shot(page, 'i18n-unit-am');

  // practice quiz
  await page.getByRole('link', { name: /የልምምድ ኩዊዝ/ }).first().click();
  await page.getByRole('button', { name: /ኩዊዙን ጀምር|ኩዊዙን ቀጥል/ }).first().click();
  await page.waitForURL(/\/attempts\//, { timeout: 15000 });
  await page.getByText(/ጥያቄ 1 ከ\d+/).first().waitFor({ timeout: 10000 }).catch(() => {});
  check('quiz runner header is Amharic', /ጥያቄ 1 ከ\d+/.test(await body(page)));
  await page.getByRole('radio').first().click();
  await page.locator('[role=status]').filter({ hasText: /ትክክል!|በትክክል አይደለም/ }).waitFor({ timeout: 8000 });
  check('practice feedback is Amharic', true);
  check('no horizontal overflow in the quiz (mobile later, desktop now)', await noHorizontalOverflow(page));
  await shot(page, 'i18n-quiz-am');
  const total = Number(/ከ(\d+)/.exec(await body(page))?.[1] ?? 1);
  for (let i = 1; i < total; i++) {
    await page.getByRole('button', { name: 'ቀጣይ', exact: true }).click();
    if (await page.getByRole('radio').count()) await page.getByRole('radio').first().click();
    else if (await page.getByRole('checkbox').count()) { await page.getByRole('checkbox').nth(0).click(); await page.getByRole('checkbox').nth(1).click(); await page.getByRole('button', { name: 'መልሱን አረጋግጥ' }).click(); }
    else { await page.locator('#short').fill('7'); await page.getByRole('button', { name: 'መልሱን አረጋግጥ' }).click(); }
    await page.locator('[role=status]').filter({ hasText: /ትክክል!|በትክክል አይደለም/ }).waitFor({ timeout: 8000 });
  }
  await page.getByRole('button', { name: 'ኩዊዙን አስገባ' }).click();
  check('submit confirmation is Amharic', await page.getByRole('alertdialog').getByText('ኩዊዝዎን ያስገቡ?').isVisible());
  await page.getByRole('alertdialog').getByRole('button', { name: 'አሁን አስገባ' }).click();
  await page.waitForURL(/\/results/, { timeout: 15000 });
  check('results page is Amharic', /መልሶችዎን ይገምግሙ/.test(await body(page)) && /የማለፊያ ውጤት/.test(await body(page)));
  check('results stats labels are Amharic', /ትክክል ያልሆነ/.test(await body(page)) && /የወሰደው ጊዜ/.test(await body(page)));
  await shot(page, 'i18n-results-am');

  for (const [path, needle] of [
    ['/exams', 'ፈተናዎች'], ['/progress', 'እድገቴ'], ['/bookmarks', 'የተቀመጡ'], ['/notifications', 'ማሳወቂያዎች'], ['/search?q=limits', 'ፈልግ'], ['/settings', 'መገለጫና ቅንብሮች'],
  ]) {
    await page.goto(`${BASE}${path}`);
    check(`${path} is Amharic`, (await has(page, needle)) && (await lang(page)) === 'am');
  }
  await page.goto(`${BASE}/progress`);
  check('progress charts are labelled in Amharic', /የኩዊዝና የፈተና ውጤቶች/.test(await body(page)));
  await shot(page, 'i18n-progress-am');
}

console.log('\nNotifications are rendered in the reader\'s language');
{
  await db.query(`insert into public.subjects (slug, title, description, icon, color, position, is_published) values ('amharic-lit', 'Amharic Literature', 'Poems and prose', 'book-open', 'rose', 99, true)`);
  await page.goto(`${BASE}/notifications`);
  check('new-subject notification uses the Amharic template', await page.getByText('አዲስ ትምህርት፦ Amharic Literature').isVisible());
  check('content name inside the sentence is untouched', /Amharic Literature/.test(await body(page)));
  const ctx2 = await browser.newContext({ locale: 'en-US' });
  const p2 = await ctx2.newPage();
  await p2.goto(`${BASE}/login`);
  await p2.fill('#email', email); await p2.fill('#password', password);
  await p2.getByRole('button', { name: 'Sign in' }).click();
  // profile locale = am, so a fresh device with no cookie also lands in Amharic after sign-in
  await p2.waitForURL(/dashboard/, { timeout: 15000 });
  check('a new device picks up the language saved on the account', (await p2.evaluate(() => document.documentElement.lang)) === 'am');
  await ctx2.close();
}

console.log('\nLanguage and theme in Settings');
{
  await page.goto(`${BASE}/settings`);
  check('settings shows Appearance and Language cards', /ገጽታ/.test(await body(page)) && /ቋንቋ/.test(await body(page)));
  await page.getByRole('radio', { name: 'English' }).click();
  await page.waitForFunction(() => document.documentElement.lang === 'en', null, { timeout: 8000 });
  check('Settings → English switches the page', /Profile & settings/.test(await body(page)));
  check('and is saved on the profile', (await db.query(`select locale from public.profiles where email = $1`, [email])).rows[0].locale === 'en');
  await page.getByRole('radio', { name: 'አማርኛ' }).click();
  await page.waitForFunction(() => document.documentElement.lang === 'am', null, { timeout: 8000 });
  check('Settings → አማርኛ switches back', (await db.query(`select locale from public.profiles where email = $1`, [email])).rows[0].locale === 'am');

  // theme
  check('light by default', !(await isDark(page)));
  await page.getByRole('radio', { name: 'ጨለማ' }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains('dark'), null, { timeout: 5000 });
  check('Dark applies the dark theme', await isDark(page));
  await page.reload();
  check('and survives a reload', await isDark(page));
  await shot(page, 'i18n-settings-dark-am');
  await page.getByRole('radio', { name: 'ብሩህ' }).click();
  await page.waitForFunction(() => !document.documentElement.classList.contains('dark'), null, { timeout: 5000 });
  check('Light switches back', !(await isDark(page)));
  await page.getByRole('radio', { name: 'እንደ መሣሪያው' }).click();
  check('System choice is selectable', (await page.getByRole('radio', { name: 'እንደ መሣሪያው' }).getAttribute('aria-checked')) === 'true');
  await page.getByRole('button', { name: 'ወደ ጨለማ ገጽታ ቀይር' }).click().catch(() => {});
  check('header toggle flips the theme', await isDark(page).catch(() => false));
}
{
  // "System" follows the OS preference
  const { page: p, context: c } = await newSession(browser, { colorScheme: 'dark' });
  await p.goto(BASE);
  check('system theme follows a dark OS preference on first visit', await isDark(p));
  await shot(p, 'i18n-landing-dark-en');
  await c.close();
}

console.log('\nTranslated server errors');
{
  const { page: p, context: c } = await newSession(browser, { locale: 'am-ET' });
  await p.goto(`${BASE}/login`);
  await p.fill('#email', email); await p.fill('#password', 'WrongPass1');
  await p.locator('form button[type=submit]').click();
  check('wrong-password error from the server is shown in Amharic', await p.getByText('ኢሜይሉ ወይም የይለፍ ቃሉ ትክክል አይደለም።').isVisible());
  await c.close();
}

console.log('\nAdmin console in Amharic');
{
  // The admin account was created through the API (default language: English). Saving Amharic on the profile
  // is what "I switched to Amharic once" looks like; sign-in then restores it on a device with no cookie.
  await db.query(`update public.profiles set locale = 'am' where email = 'admin@zetora.test'`);
  const { page: a, context: c, problems: ap } = await newSession(browser, { locale: 'en-US' });
  await a.goto(`${BASE}/login`);
  await a.fill('#email', 'admin@zetora.test'); await a.fill('#password', 'Passw0rd!');
  await a.locator('form button[type=submit]').click();
  await a.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });
  check('sign-in restores the language saved on the profile (no cookie, English browser)', (await lang(a)) === 'am');
  await a.goto(`${BASE}/admin`);
  check('admin overview is Amharic', /የትምህርት መድረክዎ አጭር ምስል/.test(await body(a)) && /ተማሪዎች/.test(await body(a)));
  check('admin sidebar is Amharic', /የጥያቄ ባንክ/.test(await body(a)));
  await shot(a, 'i18n-admin-overview-am');

  await a.goto(`${BASE}/admin/subjects`);
  await a.getByRole('button', { name: 'አዲስ ትምህርት' }).first().click();
  check('subject dialog is Amharic', await a.getByRole('dialog').getByText('የድር አድራሻ ስም').isVisible());
  await a.getByRole('dialog').getByRole('button', { name: 'ትምህርት ፍጠር' }).click();
  check('admin form validation is Amharic', await a.getByRole('dialog').getByText('ርዕስ ያስገቡ።').isVisible());
  await a.keyboard.press('Escape');

  await a.goto(`${BASE}/admin/questions`);
  await a.getByRole('button', { name: 'አዲስ ጥያቄ' }).first().click();
  check('question dialog is Amharic', await a.getByRole('dialog').getByText('የመልስ አማራጮች').isVisible());
  await a.keyboard.press('Escape');

  await a.goto(`${BASE}/admin/units`);
  check('units manager is Amharic', await has(a, 'አዲስ ምዕራፍ'));
  const unit = (await db.query(`select id from public.units where title = 'Functions and Graphs'`)).rows[0];
  await a.goto(`${BASE}/admin/summaries/${unit.id}`);
  await a.getByRole('button', { name: 'ደማቅ' }).waitFor({ timeout: 10000 });
  check('summary editor toolbar is Amharic', await a.getByRole('button', { name: 'ደማቅ' }).isVisible() && /ጎልተው የሚታዩ ሳጥኖች/.test(await a.locator('body').innerHTML()));
  await shot(a, 'i18n-admin-editor-am');
  for (const p of ['/admin/students', '/admin/materials', '/admin/quizzes', '/admin/exams', '/admin/analytics', '/admin/settings']) {
    await a.goto(`${BASE}${p}`);
    check(`${p} has no overflow and Amharic copy`, ETH.test(await a.locator('h1').first().innerText()) && (await noHorizontalOverflow(a)));
  }
  allProblems.push(...ap);
  await c.close();
}

console.log('\nPhone layout with long Amharic strings');
{
  const { page: m, context: c, problems: mp } = await newSession(browser, { mobile: true, locale: 'am-ET' });
  await m.goto(`${BASE}/login`);
  await m.fill('#email', email); await m.fill('#password', password);
  await m.locator('form button[type=submit]').click();
  await m.waitForURL(/dashboard/, { timeout: 15000 });
  for (const p of ['/', '/dashboard', '/subjects', '/subjects/mathematics', '/exams', '/progress', '/settings', '/notifications', '/bookmarks', '/search?q=limits']) {
    await m.goto(`${BASE}${p}`);
    await m.waitForLoadState('networkidle').catch(() => {});
    check(`${p} fits a 390px phone in Amharic`, await noHorizontalOverflow(m));
  }
  await m.goto(`${BASE}/dashboard`);
  await shot(m, 'i18n-dashboard-am-mobile');
  const bottom = await m.locator('nav[aria-label="ዋና"]').innerText();
  check('bottom navigation is Amharic', /ትምህርቶች/.test(bottom));
  allProblems.push(...mp);
  await c.close();
}

allProblems.push(...problems);
console.log('\nRuntime health');
check('no console errors, page errors or 5xx responses', allProblems.length === 0, '\n' + allProblems.slice(0, 5).join('\n'));
await context.close();
await browser.close();
await db.end();
process.exit(summary() ? 0 : 1);
