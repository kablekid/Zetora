import {
  BarChart3, Bell, Bookmark, ClipboardCheck, FileText, FolderOpen, GraduationCap, HelpCircle, Layers,
  LayoutDashboard, Library, ListChecks, Settings, TrendingUp, Users,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Show in the phone bottom bar. */
  mobile?: boolean;
  exact?: boolean;
}

export const STUDENT_NAV: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard, mobile: true },
  { href: '/subjects', label: 'Subjects', icon: Library, mobile: true },
  { href: '/exams', label: 'Exams', icon: ClipboardCheck, mobile: true },
  { href: '/progress', label: 'Progress', icon: TrendingUp, mobile: true },
  { href: '/bookmarks', label: 'Saved', icon: Bookmark, mobile: true },
];

export const STUDENT_SECONDARY_NAV: NavItem[] = [
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/subjects', label: 'Subjects', icon: Library },
  { href: '/admin/units', label: 'Units', icon: Layers },
  { href: '/admin/summaries', label: 'Summaries', icon: FileText },
  { href: '/admin/materials', label: 'Learning materials', icon: FolderOpen },
  { href: '/admin/questions', label: 'Question bank', icon: HelpCircle },
  { href: '/admin/quizzes', label: 'Quizzes', icon: ListChecks },
  { href: '/admin/exams', label: 'Examinations', icon: GraduationCap },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];
