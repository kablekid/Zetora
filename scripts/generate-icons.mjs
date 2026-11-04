// Renders the Zetora mark to the PNG icons the PWA manifest needs.
//   node scripts/generate-icons.mjs        (needs Playwright + a Chromium binary; set CHROMIUM_PATH if needed)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(out, { recursive: true });

const mark = (pad) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100%" height="100%">
  <g transform="translate(${16 - 16 * pad} ${16 - 16 * pad}) scale(${pad})">
    <path d="M9.5 10.5h13L9.5 21.5h13" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <circle cx="24.5" cy="8" r="2.4" fill="#5B8CFF" stroke="#fff" stroke-width="1.2"/>
  </g>
</svg>`;
const tile = (radiusPct, pad) =>
  `<html><body style="margin:0;background:transparent"><div style="width:100vw;height:100vh;border-radius:${radiusPct}%;background:linear-gradient(135deg,#4F46E5,#7C3AED);display:flex">${mark(pad)}</div></body></html>`;

const jobs = [
  ['icon-192.png', 192, tile(28, 1)],
  ['icon-512.png', 512, tile(28, 1)],
  ['icon-maskable-512.png', 512, tile(0, 0.68)], // full-bleed, content inside the 80% safe zone
  ['apple-touch-icon.png', 180, tile(0, 0.82)],  // iOS applies its own rounding
];

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
for (const [name, size, html] of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(html);
  await page.screenshot({ path: join(out, name), omitBackground: true });
  await page.close();
  console.log('wrote', name);
}
await browser.close();
