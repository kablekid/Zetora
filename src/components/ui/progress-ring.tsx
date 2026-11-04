import { cn } from '@/lib/utils';

/** Server-safe SVG ring. The percentage is also exposed as text for assistive tech. */
export function ProgressRing({
  value,
  size = 112,
  stroke = 10,
  className,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  label?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }} role="img" aria-label={`${label ?? 'Progress'}: ${v}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--primary)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * v) / 100}
          style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.22,1,0.36,1)' }}
        />
      </svg>
      <span className="absolute text-2xl font-bold tracking-tight">{v}<span className="text-sm font-semibold text-muted-foreground">%</span></span>
    </div>
  );
}
