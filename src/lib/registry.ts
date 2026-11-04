import {
  Atom, BookOpen, Brain, Calculator, Compass, Cpu, Dna, FlaskConical, Globe2, GraduationCap, Landmark,
  Languages, Leaf, Library, Microscope, Music, Palette, Pi, Scale, Sigma, Telescope, TrendingUp, Wrench,
  type LucideIcon,
} from 'lucide-react';

/** Icons administrators can choose for a subject (stored as a key in the database). */
export const SUBJECT_ICONS: Record<string, LucideIcon> = {
  'book-open': BookOpen,
  sigma: Sigma,
  calculator: Calculator,
  pi: Pi,
  atom: Atom,
  'flask-conical': FlaskConical,
  dna: Dna,
  microscope: Microscope,
  languages: Languages,
  globe: Globe2,
  landmark: Landmark,
  leaf: Leaf,
  brain: Brain,
  cpu: Cpu,
  telescope: Telescope,
  scale: Scale,
  music: Music,
  palette: Palette,
  compass: Compass,
  library: Library,
  wrench: Wrench,
  'trending-up': TrendingUp,
  'graduation-cap': GraduationCap,
};

export function subjectIcon(key: string | null | undefined): LucideIcon {
  return (key && SUBJECT_ICONS[key]) || BookOpen;
}

export interface SubjectTone {
  /** soft tinted background for icon tiles */
  tile: string;
  /** text/icon colour on the tile */
  text: string;
  /** solid bar / dot colour */
  solid: string;
  /** subtle border accent */
  ring: string;
  /** hex used by charts (works in both themes) */
  hex: string;
}

/** Static class strings so Tailwind can see them. */
export const SUBJECT_COLORS: Record<string, SubjectTone> = {
  indigo: { tile: 'bg-indigo-50 dark:bg-indigo-500/15', text: 'text-indigo-700 dark:text-indigo-300', solid: 'bg-indigo-500', ring: 'ring-indigo-200 dark:ring-indigo-500/30', hex: '#6366f1' },
  violet: { tile: 'bg-violet-50 dark:bg-violet-500/15', text: 'text-violet-700 dark:text-violet-300', solid: 'bg-violet-500', ring: 'ring-violet-200 dark:ring-violet-500/30', hex: '#8b5cf6' },
  blue: { tile: 'bg-blue-50 dark:bg-blue-500/15', text: 'text-blue-700 dark:text-blue-300', solid: 'bg-blue-500', ring: 'ring-blue-200 dark:ring-blue-500/30', hex: '#3b82f6' },
  emerald: { tile: 'bg-emerald-50 dark:bg-emerald-500/15', text: 'text-emerald-700 dark:text-emerald-300', solid: 'bg-emerald-500', ring: 'ring-emerald-200 dark:ring-emerald-500/30', hex: '#10b981' },
  amber: { tile: 'bg-amber-50 dark:bg-amber-500/15', text: 'text-amber-700 dark:text-amber-300', solid: 'bg-amber-500', ring: 'ring-amber-200 dark:ring-amber-500/30', hex: '#f59e0b' },
  rose: { tile: 'bg-rose-50 dark:bg-rose-500/15', text: 'text-rose-700 dark:text-rose-300', solid: 'bg-rose-500', ring: 'ring-rose-200 dark:ring-rose-500/30', hex: '#f43f5e' },
  cyan: { tile: 'bg-cyan-50 dark:bg-cyan-500/15', text: 'text-cyan-700 dark:text-cyan-300', solid: 'bg-cyan-500', ring: 'ring-cyan-200 dark:ring-cyan-500/30', hex: '#06b6d4' },
  orange: { tile: 'bg-orange-50 dark:bg-orange-500/15', text: 'text-orange-700 dark:text-orange-300', solid: 'bg-orange-500', ring: 'ring-orange-200 dark:ring-orange-500/30', hex: '#f97316' },
};

export function subjectTone(key: string | null | undefined): SubjectTone {
  return (key && SUBJECT_COLORS[key]) || SUBJECT_COLORS.indigo;
}

export const DIFFICULTY_LABEL: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
export const QUESTION_TYPE_LABEL: Record<string, string> = {
  multiple_choice: 'Multiple choice',
  true_false: 'True / False',
  multiple_select: 'Multiple select',
  short_answer: 'Short answer',
};
export const EXAM_KIND_LABEL: Record<string, string> = {
  unit: 'Unit exam',
  subject: 'Subject exam',
  mixed: 'Mixed-unit exam',
  mock: 'Mock exam',
};
