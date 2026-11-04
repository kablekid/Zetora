import { BASE, check, launch, newSession, noHorizontalOverflow, shot, summary } from './lib.mjs';

const browser = await launch();

console.log('\nPublic site — desktop');
{
  const { page, problems } = await newSession(browser);
  const res = await page.goto(BASE);
  check('landing returns 200', res.status() === 200);
  check('title contains Zetora', (await page.title()).includes('Zetora'));
  check('hero headline present', await page.getByRole('heading', { level: 1, name: /Your Journey to Academic Excellence Starts Here/i }).isVisible());
  check('subject cards come from the database', (await page.locator('#subjects a[href="/register"]').count()) === 5);
  check('"Mathematics" card visible', await page.locator('#subjects').getByText('Mathematics', { exact: true }).first().isVisible());
  check('footer has privacy + terms links', (await page.locator('footer a[href="/privacy"]').count()) > 0 && (await page.locator('footer a[href="/terms"]').count()) > 0);
  check('social placeholders are disabled, not fake links', (await page.locator('footer [aria-disabled="true"]').count()) >= 1);
  await shot(page, 'landing-desktop');

  for (const path of ['/about', '/contact', '/privacy', '/terms', '/login', '/register', '/forgot-password']) {
    const r = await page.goto(BASE + path);
    check(`${path} renders`, r.status() === 200);
  }
  await page.goto(BASE + '/contact');
  check('contact shows configured email', await page.getByRole('link', { name: 'hello@zetora.test' }).isVisible());

  const nf = await page.goto(BASE + '/this-page-does-not-exist');
  check('unknown route → 404 page', nf.status() === 404 && (await page.getByText('We couldn’t find that page').isVisible()));
  await shot(page, '404-desktop');

  await page.goto(BASE + '/dashboard');
  check('/dashboard redirects anonymous users to /login?next=', page.url().includes('/login') && page.url().includes('next=%2Fdashboard'));
  await page.goto(BASE + '/admin');
  check('/admin redirects anonymous users to /login', page.url().includes('/login'));
  const api = await page.request.get(BASE + '/api/resources/00000000-0000-4000-8000-000000000000');
  check('resource API refuses anonymous users (401)', api.status() === 401);
  check('no runtime errors on public pages', problems.length === 0, JSON.stringify(problems));
  await page.context().close();
}

console.log('\nPublic site — mobile');
{
  const { page, problems } = await newSession(browser, { mobile: true });
  await page.goto(BASE);
  check('landing has no horizontal overflow on phone', await noHorizontalOverflow(page));
  await shot(page, 'landing-mobile');
  await page.getByRole('button', { name: 'Open menu' }).click();
  check('mobile menu opens', await page.getByRole('link', { name: 'Get started' }).first().isVisible());
  await page.keyboard.press('Escape');
  for (const path of ['/login', '/register', '/about', '/privacy']) {
    await page.goto(BASE + path);
    check(`${path} has no horizontal overflow on phone`, await noHorizontalOverflow(page));
  }
  await shot(page, 'register-mobile', { full: false });
  check('no runtime errors on mobile public pages', problems.length === 0, JSON.stringify(problems));
  await page.context().close();
}

console.log('\nDark mode');
{
  const { page } = await newSession(browser, { colorScheme: 'dark' });
  await page.goto(BASE);
  check('dark mode applies via system preference', await page.evaluate(() => document.documentElement.classList.contains('dark')));
  await shot(page, 'landing-dark', { full: false });
  await page.context().close();
}

await browser.close();
process.exit(summary() ? 0 : 1);
