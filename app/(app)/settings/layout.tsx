import { PageHeader } from "@/components/shared/page-header";
import { SettingsTabs } from "@/components/settings/settings-tabs";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <PageHeader title="Configurações" description="Workspace, time e assinatura." />
      <SettingsTabs />
      <div className="max-w-3xl">{children}</div>
    </div>
  );
}
