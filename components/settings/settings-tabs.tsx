"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { settingsNavFor } from "@/lib/nav";
import type { MemberRole } from "@/types/domain";
import { cn } from "@/lib/utils";

export function SettingsTabs({ role }: { role: MemberRole }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 border-b border-border" aria-label="Seções das configurações">
      {settingsNavFor(role).map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
              active
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
