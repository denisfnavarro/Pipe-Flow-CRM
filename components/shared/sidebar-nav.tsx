"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAV, settingsNavFor, type NavItem } from "@/lib/nav";
import type { MemberRole } from "@/types/domain";
import { cn } from "@/lib/utils";

function NavLink({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} aria-hidden />
      {item.label}
    </Link>
  );
}

export function SidebarNav({ role, onNavigate }: { role: MemberRole; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-6 px-3 py-4" aria-label="Navegação principal">
      <div className="space-y-1">
        {MAIN_NAV.map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </div>

      <div className="space-y-1">
        <p className="px-2.5 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Configurações
        </p>
        {settingsNavFor(role).map((item) => (
          <NavLink key={item.href} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
  );
}
