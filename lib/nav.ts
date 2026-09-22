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

export const SETTINGS_NAV: NavItem[] = [
  { href: "/settings/workspace", label: "Workspace", icon: Settings },
  { href: "/settings/members", label: "Membros", icon: Users },
  { href: "/settings/billing", label: "Plano e cobrança", icon: BarChart3 },
];
