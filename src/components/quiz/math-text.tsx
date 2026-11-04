'use client';
import { useEffect, useState } from 'react';

/**
 * Plain text with optional inline maths between $…$ (e.g. "What is $x^2$?").
 * KaTeX is loaded lazily and only when the text actually contains maths.
 */
export function MathText({ text, className }: { text: string; className?: string }) {
  const hasMath = text.includes('$');
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!hasMath) return;
    let alive = true;
    import('katex').then(({ default: katex }) => {
      if (!alive) return;
      const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const parts = text.split(/(\$[^$]+\$)/g);
      const out = parts
        .map((p) => {
          if (p.length > 2 && p.startsWith('$') && p.endsWith('$')) {
            try {
              return katex.renderToString(p.slice(1, -1), { throwOnError: false, output: 'html', strict: 'ignore' });
            } catch {
              return esc(p);
            }
          }
          return esc(p).replace(/\n/g, '<br/>');
        })
        .join('');
      setHtml(out);
    });
    return () => {
      alive = false;
    };
  }, [text, hasMath]);

  if (!hasMath || html === null) return <span className={className}>{hasMath ? text.replace(/\$/g, '') : text}</span>;
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
