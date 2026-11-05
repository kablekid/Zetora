import {
  BarChart3, Bell, Bookmark, ClipboardCheck, FileText, FolderOpen, GraduationCap, HelpCircle, Layers,
  LayoutDashboard, Library, ListChecks, Settings, TrendingUp, Users,
  type LucideIcon,
} from 'lucide-react';
import type { Paths } from '@/i18n/core';
import type { Messages } from '@/i18n/messages';

export type NavLabelKey = Extract<Paths<Messages['nav']>, `student.${string}` | `secondary.${string}` | `admin.${string}`>;

export interface NavItem {
  href: string;
  labelKey: NavLabelKey;
  icon: LucideIcon;
  /** Show in the phone bottom bar. */
  mobile?: boolean;
  exact?: boolean;
}

export const STUDENT_NAV: NavItem[] = [
  { href: '/dashboard', labelKey: 'student.home', icon: LayoutDashboard, mobile: true },
  { href: '/subjects', labelKey: 'student.subjects', icon: Library, mobile: true },
  { href: '/exams', labelKey: 'student.exams', icon: ClipboardCheck, mobile: true },
  { href: '/progress', labelKey: 'student.progress', icon: TrendingUp, mobile: true },
  { href: '/bookmarks', labelKey: 'student.saved', icon: Bookmark, mobile: true },
];

export const STUDENT_SECONDARY_NAV: NavItem[] = [
  { href: '/notifications', labelKey: 'secondary.notifications', icon: Bell },
  { href: '/settings', labelKey: 'secondary.settings', icon: Settings },
];

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', labelKey: 'admin.overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/students', labelKey: 'admin.students', icon: Users },
  { href: '/admin/subjects', labelKey: 'admin.subjects', icon: Library },
  { href: '/admin/units', labelKey: 'admin.units', icon: Layers },
  { href: '/admin/summaries', labelKey: 'admin.summaries', icon: FileText },
  { href: '/admin/materials', labelKey: 'admin.materials', icon: FolderOpen },
  { href: '/admin/questions', labelKey: 'admin.questions', icon: HelpCircle },
  { href: '/admin/quizzes', labelKey: 'admin.quizzes', icon: ListChecks },
  { href: '/admin/exams', labelKey: 'admin.exams', icon: GraduationCap },
  { href: '/admin/analytics', labelKey: 'admin.analytics', icon: BarChart3 },
  { href: '/admin/settings', labelKey: 'admin.settings', icon: Settings },
];
