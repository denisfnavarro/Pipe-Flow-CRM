"use client";

import { Menu } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/shared/logo";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { WorkspaceSwitcher } from "@/components/shared/workspace-switcher";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { Workspace } from "@/types/domain";

interface MobileNavProps {
  workspaces: Workspace[];
  currentWorkspaceId: string;
}

/** Abaixo de `md` a sidebar vira drawer. */
export function MobileNav({ workspaces, currentWorkspaceId }: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" aria-label="Abrir menu">
          <Menu className="h-4 w-4" aria-hidden />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-sidebar p-0">
        <SheetTitle className="sr-only">Navegação</SheetTitle>
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <Logo />
        </div>
        <div className="px-3 pt-3">
          <WorkspaceSwitcher workspaces={workspaces} currentId={currentWorkspaceId} />
        </div>
        <SidebarNav onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
