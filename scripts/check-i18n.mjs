// Verifies the Amharic translation is complete and consistent with the English source.
//   • same keys and same array lengths in both languages (TypeScript also enforces the keys)
//   • every {placeholder} and <tag> in English is present in Amharic, and vice-versa
//   • no empty or still-English Amharic strings
//   • every message the server can send has an entry in am/server-text.ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { collectServerText } from './collect-server-text.mjs';

const SRC = path.resolve('src/i18n/messages');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zetora-i18n-'));

// Transpile the dictionaries to plain ESM so they can be imported without a TS runner.
function resolveLocal(from, spec) {
  const base = path.resolve(path.dirname(from), spec);
  if (fs.existsSync(`${base}.ts`)) return `${spec}.mjs`;
  if (fs.existsSync(path.join(base, 'index.ts'))) return `${spec}/index.mjs`;
  throw new Error(`Cannot resolve ${spec} from ${from}`);
}
(function build(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { build(p); continue; }
    if (!p.endsWith('.ts')) continue;
    const out = ts.transpileModule(fs.readFileSync(p, 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
      .replace(/(from\s+['"])(\.{1,2}\/[^'"]+)(['"])/g, (_m, a, spec, c) => `${a}${resolveLocal(p, spec)}${c}`);
    const target = path.join(tmp, path.relative(SRC, p).replace(/\.ts$/, '.mjs'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, out);
  }
})(SRC);
const load = (rel) => import(pathToFileURL(path.join(tmp, rel)).href);
const { en } = await load('en/index.mjs');
const { am } = await load('am/index.mjs');
const { default: serverText } = await load('am/server-text.mjs');

const problems = [];
const warn = [];
const fail = (msg) => problems.push(msg);

const tokens = (s) => [...s.matchAll(/\{(\w+)\}|<\/?(\w+)>/g)].map((m) => (m[1] ? `{${m[1]}}` : `<${m[2]}>`)).sort().join(' ');
const hasEthiopic = (s) => /[ሀ-፿]/.test(s);
// strings that are legitimately identical in both languages
const SAME_OK = /^(Zetora|PDF|JPG|PNG|WebP|LaTeX|Esc|Ctrl K|[A-Z]{2,5}|[\W\d_]*|.*@.*|https?:.*|\/.*)$/;

function compare(a, b, p) {
  if (typeof a === 'string') {
    if (typeof b !== 'string') return fail(`${p}: type differs`);
    if (!b.trim()) return fail(`${p}: empty Amharic string`);
    if (tokens(a) !== tokens(b)) fail(`${p}: placeholders differ — en [${tokens(a)}] vs am [${tokens(b)}]`);
    const bare = b.replace(/\{\w+\}/g, '');
    if (!hasEthiopic(b) && /[A-Za-z]{3,}/.test(bare) && !SAME_OK.test(b.trim())) warn.push(`${p}: no Amharic text → "${b.slice(0, 50)}"`);
    return;
  }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return fail(`${p}: array length differs (${a.length} vs ${b?.length})`);
    a.forEach((x, i) => compare(x, b[i], `${p}[${i}]`));
    return;
  }
  if (a && typeof a === 'object') {
    if (!b || typeof b !== 'object') return fail(`${p}: missing in Amharic`);
    for (const k of Object.keys(a)) compare(a[k], b[k], p ? `${p}.${k}` : k);
    for (const k of Object.keys(b)) if (!(k in a)) fail(`${p}.${k}: extra key in Amharic`);
  }
}
compare(en, am, '');

// server-originated sentences
const keys = Object.keys(serverText);
const covered = (msg) => msg in serverText || keys.some((k) => k.endsWith('…') && msg.startsWith(k.slice(0, -1)));
const found = collectServerText();
for (const extra of ['Published']) found.set(extra, new Set(['src/lib/actions/admin.ts']));
for (const [msg, files] of found) if (!covered(msg)) fail(`server text not translated: "${msg}" (${[...files].join(', ')})`);
for (const [k, v] of Object.entries(serverText)) {
  if (!hasEthiopic(v)) fail(`server text "${k}" has no Amharic translation`);
  if (!k.endsWith('…') && !found.has(k)) warn.push(`server text "${k}" is no longer sent by the server (stale entry?)`);
}

fs.rmSync(tmp, { recursive: true, force: true });

for (const w of warn) console.warn('warn:', w);
if (problems.length) {
  for (const p of problems) console.error('✗', p);
  console.error(`\n${problems.length} i18n problem(s).`);
  process.exit(1);
}
const count = (o) => (typeof o === 'string' ? 1 : Array.isArray(o) ? o.reduce((n, x) => n + count(x), 0) : o && typeof o === 'object' ? Object.values(o).reduce((n, x) => n + count(x), 0) : 0);
console.log(`✓ i18n OK — ${count(en)} strings × 2 languages, ${keys.length} server messages${warn.length ? `, ${warn.length} warning(s)` : ''}.`);
