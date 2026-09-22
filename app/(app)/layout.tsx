import { Logo } from "@/components/shared/logo";
import { MobileNav } from "@/components/shared/mobile-nav";
import { SidebarNav } from "@/components/shared/sidebar-nav";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { UserMenu } from "@/components/shared/user-menu";
import { WorkspaceSwitcher } from "@/components/shared/workspace-switcher";
import { listMyWorkspaces, requireWorkspace } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // Redireciona para /login sem sessão e para /onboarding sem workspace.
  const { user, workspace } = await requireWorkspace();
  const workspaces = await listMyWorkspaces();

  const member = {
    name: (user.user_metadata?.full_name as string | undefined) ?? user.email?.split("@")[0] ?? "",
    email: user.email ?? "",
    avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
  };

  return (
    <div className="min-h-dvh bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
          <Logo />
        </div>
        <div className="px-3 pt-3">
          <WorkspaceSwitcher workspaces={workspaces} currentId={workspace.id} />
        </div>
        <SidebarNav role={workspace.role} />
      </aside>

      <div className="flex min-h-dvh flex-col md:pl-60">
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <MobileNav
            workspaces={workspaces}
            currentWorkspaceId={workspace.id}
            role={workspace.role}
          />
          <span className="md:hidden">
            <Logo showName={false} />
          </span>
          <div className="flex-1" />
          <ThemeToggle />
          <UserMenu member={member} />
        </header>

        <main className="flex-1 px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
