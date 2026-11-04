/** Renders [[match]] markers from search_content() as <mark> without using innerHTML. */
export function HighlightedSnippet({ text }: { text: string }) {
  // split() with one capture group alternates: plain, match, plain, match, …
  const parts = text.split(/\[\[(.*?)\]\]/);
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="rounded bg-warning-soft px-0.5 font-medium text-foreground">
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}
