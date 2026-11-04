import 'server-only';
import sanitizeHtml from 'sanitize-html';
import katex from 'katex';

/**
 * Summaries are authored by administrators in the rich-text editor, but we still
 * sanitise on the way in AND on the way out (defence in depth).
 */
const ALLOWED = {
  allowedTags: [
    'h2', 'h3', 'h4', 'p', 'br', 'hr', 'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 'u', 's', 'mark',
    'blockquote', 'code', 'pre', 'sub', 'sup', 'a', 'img', 'div', 'span',
    'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    div: ['data-type', 'data-variant', 'data-latex'],
    span: ['data-type', 'data-latex'],
    th: ['colspan', 'rowspan', 'colwidth', 'style'],
    td: ['colspan', 'rowspan', 'colwidth', 'style'],
    p: ['style'],
    h2: ['style'], h3: ['style'], h4: ['style'],
  },
  allowedStyles: {
    '*': { 'text-align': [/^(left|right|center|justify)$/] },
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  transformTags: {
    a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer', target: '_blank' }),
  },
  exclusiveFilter(frame: { tag: string; attribs: Record<string, string> }) {
    if (frame.tag === 'div') {
      const t = frame.attribs['data-type'];
      return t !== undefined && t !== 'callout' && t !== 'math-block';
    }
    if (frame.tag === 'span') {
      const t = frame.attribs['data-type'];
      return t !== undefined && t !== 'math';
    }
    return false;
  },
} satisfies sanitizeHtml.IOptions;

const VARIANTS = new Set(['definition', 'note', 'key', 'example', 'warning']);

export function sanitizeSummary(html: string): string {
  const clean = sanitizeHtml(html, ALLOWED);
  // Normalise callout variants to the known set.
  return clean.replace(/data-variant="([^"]*)"/g, (_m, v: string) =>
    `data-variant="${VARIANTS.has(v) ? v : 'note'}"`,
  );
}

export function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ');
  return text.split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 180));
}

function unescapeAttr(v: string) {
  return v.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
}

/** Replace math placeholders with KaTeX markup, wrap tables for horizontal scroll, add heading ids. */
export function renderSummary(html: string): { html: string; headings: { id: string; text: string; level: 2 | 3 }[] } {
  let out = sanitizeSummary(html);

  // Math nodes are empty elements whose attributes may appear in any order
  // (the editor writes data-latex before data-type; seeded content the reverse).
  out = out.replace(/<(span|div)\b([^>]*)><\/\1>/g, (match, _tag: string, attrs: string) => {
    const kind = /data-type="(math|math-block)"/.exec(attrs)?.[1];
    if (!kind) return match;
    const latex = unescapeAttr(/data-latex="([^"]*)"/.exec(attrs)?.[1] ?? '');
    const display = kind === 'math-block';
    let rendered: string;
    try {
      rendered = katex.renderToString(latex, { displayMode: display, throwOnError: false, output: 'html', strict: 'ignore' });
    } catch {
      rendered = `<code>${latex.replace(/</g, '&lt;')}</code>`;
    }
    return display ? `<div data-type="math-block">${rendered}</div>` : rendered;
  });

  out = out.replace(/<table/g, '<div class="table-scroll"><table').replace(/<\/table>/g, '</table></div>');

  const headings: { id: string; text: string; level: 2 | 3 }[] = [];
  const used = new Set<string>();
  out = out.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g, (_m, lvl: string, attrs: string, inner: string) => {
    const text = inner.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
    let id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'section';
    while (used.has(id)) id += '-2';
    used.add(id);
    if (lvl === '2' || lvl === '3') headings.push({ id, text, level: Number(lvl) as 2 | 3 });
    return `<h${lvl}${attrs} id="${id}">${inner}</h${lvl}>`;
  });

  return { html: out, headings };
}
