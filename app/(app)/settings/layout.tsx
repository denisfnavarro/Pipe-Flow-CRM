import { PageHeader } from "@/components/shared/page-header";
import { requireWorkspace } from "@/lib/auth";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { workspace } = await requireWorkspace();

  return (
    <div className="space-y-5">
      <PageHeader title="Configurações" description="Workspace, time e assinatura." />
      <SettingsTabs role={workspace.role} />
      <div className="max-w-3xl">{children}</div>
    </div>
  );
}
