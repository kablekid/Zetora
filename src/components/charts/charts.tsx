'use client';
import {
  Area, Bar, BarChart, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { ChartFrame, ChartTooltip } from './chart-frame';
import { useT } from '@/i18n/client';

const AXIS = { fontSize: 11, fill: 'var(--muted-foreground)' } as const;
const GRID = 'var(--chart-grid)';
const SERIES = 'var(--chart-1)';

export interface ScorePoint { label: string; title: string; value: number; kind: string }

/** Quiz & exam scores over time — one series, 2px line, ringed markers, 10% area wash. */
export function ScoreTrendChart({ data, className }: { data: ScorePoint[]; className?: string }) {
  const t = useT('charts');
  return (
    <ChartFrame
      className={className}
      title={t('score.title')}
      description={t('score.description')}
      empty={data.length === 0}
      emptyText={t('score.empty')}
      columns={[t('score.columns.date'), t('score.columns.activity'), t('score.columns.score')]}
      rows={data.map((d) => [d.label, d.title, `${d.value}%`])}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <ComposedChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -4 }}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" minTickGap={24} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} width={44} />
          <Tooltip
            cursor={{ stroke: 'var(--input)', strokeWidth: 1 }}
            content={<ChartTooltip title={(p) => String(p.title)} format={(v, p) => t('score.tooltip', { pct: v, kind: p.kind === 'exam' ? t('score.exam') : t('score.quiz'), label: String(p.label) })} />}
          />
          <Area type="monotone" dataKey="value" stroke="none" fill={SERIES} fillOpacity={0.1} isAnimationActive={false} />
          <Line
            type="monotone" dataKey="value" stroke={SERIES} strokeWidth={2}
            dot={{ r: 4, fill: SERIES, stroke: 'var(--card)', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: SERIES, stroke: 'var(--card)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export interface DayPoint { label: string; value: number; full: string }

/** Study activity per day — single-series columns, 4px rounded tips, capped at 24px. */
export function ActivityChart({ data, className }: { data: DayPoint[]; className?: string }) {
  const t = useT('charts');
  const empty = data.every((d) => d.value === 0);
  const max = Math.max(4, ...data.map((d) => d.value));
  return (
    <ChartFrame
      className={className}
      title={t('activity.title')}
      description={t('activity.description')}
      empty={empty}
      emptyText={t('activity.empty')}
      columns={[t('activity.columns.day'), t('activity.columns.actions')]}
      rows={data.map((d) => [d.full, d.value])}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" minTickGap={12} />
          <YAxis allowDecimals={false} domain={[0, max]} tick={AXIS} tickLine={false} axisLine={false} width={40} />
          <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.6 }} content={<ChartTooltip title={(p) => String(p.full)} format={(v) => t('activity.tooltip', { count: v })} />} />
          <Bar dataKey="value" fill={SERIES} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export interface SubjectPoint { name: string; value: number; attempts: number }

/** Average score by subject — one series, value at the bar tip via axis + tooltip. */
export function SubjectBarsChart({ data, className }: { data: SubjectPoint[]; className?: string }) {
  const t = useT('charts');
  const tc = useT('common');
  const height = Math.max(180, data.length * 44 + 24);
  return (
    <ChartFrame
      className={className}
      height={height}
      title={t('subject.title')}
      description={t('subject.description')}
      empty={data.length === 0}
      emptyText={t('subject.empty')}
      columns={[t('subject.columns.subject'), t('subject.columns.average'), t('subject.columns.attempts')]}
      rows={data.map((d) => [d.name, `${d.value}%`, d.attempts])}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, bottom: 0, left: 0 }} barCategoryGap="30%">
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" domain={[0, 100]} ticks={[0, 50, 100]} tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
          <YAxis type="category" dataKey="name" tick={{ ...AXIS, fill: 'var(--foreground)' }} tickLine={false} axisLine={false} width={92} />
          <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.6 }} content={<ChartTooltip title={(p) => String(p.name)} format={(v, p) => t('subject.tooltip', { pct: v, attempts: tc('count.attempt', { count: Number(p.attempts) }) })} />} />
          <Bar dataKey="value" fill={SERIES} maxBarSize={20} radius={[0, 4, 4, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/** Generic single-series column chart used by the admin analytics page. */
export function ColumnChart({
  title, description, unitLabel, data, emptyText, className,
}: {
  title: string; description?: string; unitLabel: string; data: DayPoint[]; emptyText: string; className?: string;
}) {
  const t = useT('charts');
  const empty = data.every((d) => d.value === 0);
  const max = Math.max(4, ...data.map((d) => d.value));
  return (
    <ChartFrame
      className={className}
      title={title}
      description={description}
      empty={empty}
      emptyText={emptyText}
      columns={[t('column.day'), unitLabel]}
      rows={data.map((d) => [d.full, d.value])}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: GRID }} interval="preserveStartEnd" minTickGap={28} />
          <YAxis allowDecimals={false} domain={[0, max]} tick={AXIS} tickLine={false} axisLine={false} width={40} />
          <Tooltip cursor={{ fill: 'var(--muted)', opacity: 0.6 }} content={<ChartTooltip title={(p) => String(p.full)} format={(v) => `${v} ${unitLabel.toLowerCase()}`} />} />
          <Bar dataKey="value" fill={SERIES} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
