// Copies the pdf.js worker + font/cmap data into /public/pdfjs so the in-app PDF
// viewer can load them from our own origin (no CDN, works offline-first/PWA).
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'node_modules', 'pdfjs-dist');
const dest = join(root, 'public', 'pdfjs');
if (!existsSync(src)) {
  console.log('pdfjs-dist not installed yet — skipping asset copy');
  process.exit(0);
}
mkdirSync(dest, { recursive: true });
cpSync(join(src, 'build', 'pdf.worker.min.mjs'), join(dest, 'pdf.worker.min.mjs'));
for (const dir of ['cmaps', 'standard_fonts', 'wasm', 'iccs']) {
  if (existsSync(join(src, dir))) cpSync(join(src, dir), join(dest, dir), { recursive: true });
}
console.log('Copied pdf.js assets to public/pdfjs');
