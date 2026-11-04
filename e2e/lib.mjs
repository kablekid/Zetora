import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const SHOTS = join(here, 'screenshots');
mkdirSync(SHOTS, { recursive: true });
export const BASE = process.env.BASE_URL || 'http://localhost:3100';

let passed = 0;
export const failures = [];
export function check(name, cond, extra = '') {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failures.push(name); console.log(`  ✗ ${name} ${extra}`); }
}
export function summary() {
  console.log(`\n${passed} passed, ${failures.length} failed`);
  if (failures.length) console.log('Failures:\n - ' + failures.join('\n - '));
  return failures.length === 0;
}

export async function launch() {
  return chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
}

/** A browser context with console/network error tracking. */
export async function newSession(browser, { mobile = false, colorScheme = 'light' } = {}) {
  const context = await browser.newContext(
    mobile
      ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme }
      : { viewport: { width: 1360, height: 860 }, deviceScaleFactor: 1, colorScheme },
  );
  const page = await context.newPage();
  // Streaming SSR can deliver content just after `load`; make visibility checks wait (up to 8 s) instead of racing.
  const proto = Object.getPrototypeOf(page.locator('body'));
  if (!proto.__waitingIsVisible) {
    proto.isVisible = async function () {
      try { await this.first().waitFor({ state: 'visible', timeout: 8000 }); return true; } catch { return false; }
    };
    proto.__waitingIsVisible = true;
  }
  const problems = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text();
    if (/Failed to load resource/.test(t)) return; // reported via response handler
    problems.push(`console @ ${page.url()}: ${t.slice(0, 1800)}`);
  });
  page.on('response', (r) => {
    const s = r.status();
    if (s >= 500) problems.push(`HTTP ${s} ${r.url()}`);
  });
  return { context, page, problems };
}

export async function shot(page, name, { full = true } = {}) {
  // Let hydration finish first: resizing the viewport mid-hydration (full-page capture) triggers spurious warnings.
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(SHOTS, `${name}.png`), fullPage: full });
}

export async function noHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
}

export async function login(page, email, password) {
  await page.goto(`${BASE}/login`);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
}
