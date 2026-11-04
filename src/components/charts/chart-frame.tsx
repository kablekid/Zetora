'use client';
import { useId, useState } from 'react';
import { Table2, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Wraps a chart with a title, an accessible "table view" toggle (so nothing is
 * conveyed by colour/shape alone) and an empty state.
 */
export function ChartFrame({
  title,
  description,
  empty,
  emptyText,
  columns,
  rows,
  children,
  className,
  height = 220,
}: {
  title: string;
  description?: string;
  empty?: boolean;
  emptyText?: string;
  columns: string[];
  rows: (string | number)[][];
  children: React.ReactNode;
  className?: string;
  height?: number;
}) {
  const [table, setTable] = useState(false);
  const id = useId();
  return (
    <section className={cn('flex flex-col', className)} aria-labelledby={id}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={id} className="text-[15px] font-semibold tracking-tight">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {!empty && (
          <button
            type="button"
            onClick={() => setTable((t) => !t)}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-pressed={table}
          >
            {table ? <BarChart3 className="size-3.5" /> : <Table2 className="size-3.5" />}
            {table ? 'Chart' : 'Table'}
          </button>
        )}
      </div>
      {empty ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground" style={{ minHeight: height }}>
          {emptyText ?? 'No data yet.'}
        </div>
      ) : table ? (
        <div className="overflow-auto rounded-lg border" style={{ maxHeight: height + 28 }}>
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
              <tr>{columns.map((c) => <th key={c} className="px-3 py-2 font-medium">{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t">
                  {r.map((cell, j) => <td key={j} className="px-3 py-2 tabular-nums">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ height }} className="w-full min-w-0">{children}</div>
      )}
    </section>
  );
}

/** Tooltip body shared by all charts (text tokens only, never the series colour). */
export function ChartTooltip({
  active,
  payload,
  label,
  format,
  title,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string; payload?: Record<string, unknown> }>;
  label?: string | number;
  format: (v: number, p: Record<string, unknown>) => string;
  title?: (p: Record<string, unknown>, label?: string | number) => string;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  const row = (p.payload ?? {}) as Record<string, unknown>;
  return (
    <div className="max-w-56 rounded-lg border bg-popover px-3 py-2 text-xs shadow-[var(--shadow-pop)]">
      <p className="font-medium text-foreground">{title ? title(row, label) : String(label ?? '')}</p>
      <p className="mt-0.5 text-muted-foreground">{format(Number(p.value), row)}</p>
    </div>
  );
}
