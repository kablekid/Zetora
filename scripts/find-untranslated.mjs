// Finds user-visible text that is still hard-coded in components/pages.
//   node scripts/find-untranslated.mjs [path-filter]          (exit 1 when anything is found)
// Looks at JSX text, text-like JSX attributes (placeholder, aria-label, title, alt …), string literals
// rendered inside JSX expressions, and text-like object properties (label, title, description …).
// Add  // i18n-ignore  to a line to silence a deliberate exception.
import ts from 'typescript';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const filter = process.argv[2] ?? '';
const SKIP_DIRS = new Set(['i18n', 'node_modules', '.next']);
const TEXT_ATTRS = new Set(['placeholder', 'aria-label', 'title', 'alt', 'aria-description', 'label', 'description', 'aria-roledescription']);
const TEXT_PROPS = new Set(['label', 'title', 'description', 'text', 'placeholder', 'message', 'error', 'hint', 'emptyText', 'cta', 'eyebrow']);
const ALLOW = /^(zetora|ctrl k|esc|pdf|png|jpg|jpeg|webp|kb|mb|gb|b|am|en|ok|id|a|b|c|d|x|y|f|g|n|—|·|\/|%)$/i;

const hasWords = (s) => /[A-Za-z]{3,}/.test(s) && !/^[\w./:#?&=%@~-]+$/.test(s.trim()); // ignore ids, urls, class-like tokens
const looksLikeText = (s) => hasWords(s) && (/\s/.test(s.trim()) || /^[A-Z][a-z]+/.test(s.trim()));

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx)$/.test(name)) out.push(p);
  }
  return out;
}

const findings = [];
for (const file of walk(join(root, 'src'))) {
  const rel = relative(root, file);
  if (filter && !rel.includes(filter)) continue;
  const text = readFileSync(file, 'utf8');
  const lines = text.split('\n');
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const report = (node, value) => {
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    if (/i18n-ignore/.test(lines[line])) return;
    if (ALLOW.test(value.trim())) return;
    findings.push(`${rel}:${line + 1}  ${JSON.stringify(value.trim().slice(0, 70))}`);
  };
  const inJsx = (n) => { for (let p = n.parent; p; p = p.parent) { if (ts.isJsxElement(p) || ts.isJsxSelfClosingElement(p) || ts.isJsxFragment(p)) return true; } return false; };

  (function visit(node) {
    if (ts.isJsxText(node)) {
      const v = node.getText().replace(/\s+/g, ' ').trim();
      if (v && hasWords(v)) report(node, v);
    } else if (ts.isJsxAttribute(node) && TEXT_ATTRS.has(node.name.getText())) {
      const init = node.initializer;
      if (init && ts.isStringLiteral(init) && hasWords(init.text)) report(init, init.text);
      if (init && ts.isJsxExpression(init) && init.expression && (ts.isStringLiteral(init.expression) || ts.isNoSubstitutionTemplateLiteral(init.expression)) && hasWords(init.expression.text)) report(init, init.expression.text);
    } else if (ts.isJsxExpression(node) && node.expression && (ts.isStringLiteral(node.expression) || ts.isNoSubstitutionTemplateLiteral(node.expression)) && !ts.isJsxAttribute(node.parent)) {
      if (hasWords(node.expression.text)) report(node, node.expression.text);
    } else if (ts.isPropertyAssignment(node) && TEXT_PROPS.has(node.name.getText()) && (ts.isStringLiteral(node.initializer) || ts.isNoSubstitutionTemplateLiteral(node.initializer))) {
      if (looksLikeText(node.initializer.text) && inJsx(node) === false) report(node.initializer, node.initializer.text);
    } else if (ts.isCallExpression(node) && /^(toast\.(success|error|info|warning)|setError|fail)$/.test(node.expression.getText()) && node.arguments[0] && ts.isStringLiteral(node.arguments[0]) && hasWords(node.arguments[0].text)) {
      report(node.arguments[0], node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  })(sf);
}

findings.sort();
console.log(findings.join('\n'));
const files = new Set(findings.map((f) => f.split(':')[0]));
console.log(`\n${findings.length} hard-coded string(s) in ${files.size} file(s)`);
process.exit(findings.length ? 1 : 0);
