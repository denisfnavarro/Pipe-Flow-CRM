"use client";

import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Workspace } from "@/types/domain";

interface WorkspaceSwitcherProps {
  workspaces: Workspace[];
  currentId: string;
}

/**
 * Estático por ora: troca apenas o estado local. Na M7 passa a gravar o
 * workspace ativo em cookie e recarregar os dados do servidor.
 */
export function WorkspaceSwitcher({ workspaces, currentId }: WorkspaceSwitcherProps) {
  const [activeId, setActiveId] = useState(currentId);
  const active = workspaces.find((w) => w.id === activeId) ?? workspaces[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md border border-sidebar-border bg-background px-2 py-1.5 text-left text-sm transition-colors hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-[10px] font-semibold text-primary">
          {initials(active.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{active.name}</span>
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[15rem]">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Workspaces</DropdownMenuLabel>
        {workspaces.map((workspace) => (
          <DropdownMenuItem
            key={workspace.id}
            onSelect={() => setActiveId(workspace.id)}
            className="gap-2"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-semibold">
              {initials(workspace.name)}
            </span>
            <span className="flex-1 truncate">{workspace.name}</span>
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase",
                workspace.plan === "pro"
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {workspace.plan}
            </span>
            {workspace.id === active.id ? <Check className="h-3.5 w-3.5" aria-hidden /> : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-muted-foreground">
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Criar workspace
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
