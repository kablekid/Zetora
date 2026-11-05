// Finds the English sentences the server can send to the browser (validation messages, action results,
// API errors) plus the messages raised by the database. Used by `npm run check:i18n`.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const SERVER_FILES = /src\/lib\/(validators|actions)|actions-helpers|src\/app\/api|src\/app\/auth|src\/lib\/auth|src\/lib\/queries/;

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(p);
  }
  return out;
}

/** Map<english sentence, Set<file>> */
export function collectServerText(root = '.') {
  const found = new Map();
  const add = (text, file) => found.set(text, (found.get(text) ?? new Set()).add(file));

  for (const file of walk(path.join(root, 'src')).filter((f) => SERVER_FILES.test(f.replaceAll('\\', '/')))) {
    const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
    (function visit(n) {
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) {
        const text = n.text;
        if (/^[A-Z][^\n]{8,}/.test(text) && /[a-z] [a-z]/.test(text) && !/^(SELECT|INSERT|http)/.test(text)) add(text, path.relative(root, file));
      }
      ts.forEachChild(n, visit);
    })(sf);
  }

  // RAISE EXCEPTION '…' in the migrations
  const dir = path.join(root, 'supabase', 'migrations');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.sql'))) {
    const sql = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of sql.matchAll(/raise exception\s+'([^']+)'/gi)) add(m[1], `supabase/migrations/${f}`);
  }
  return found;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  for (const [text, files] of [...collectServerText()].sort((a, b) => a[0].localeCompare(b[0]))) console.log(JSON.stringify(text), '←', [...files].join(', '));
}
