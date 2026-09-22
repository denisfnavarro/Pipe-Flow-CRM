import {
  BarChart3,
  CalendarDays,
  KanbanSquare,
  LayoutDashboard,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/calendar", label: "Calendário", icon: CalendarDays },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
];

export interface SettingsNavItem extends NavItem {
  /** Itens de admin somem para quem é membro — e as policies recusam do mesmo jeito. */
  adminOnly?: boolean;
}

export const SETTINGS_NAV: SettingsNavItem[] = [
  { href: "/settings/workspace", label: "Workspace", icon: Settings },
  { href: "/settings/members", label: "Membros", icon: Users, adminOnly: true },
  { href: "/settings/billing", label: "Plano e cobrança", icon: BarChart3, adminOnly: true },
];

export function settingsNavFor(role: "admin" | "member"): SettingsNavItem[] {
  return SETTINGS_NAV.filter((item) => role === "admin" || !item.adminOnly);
}
