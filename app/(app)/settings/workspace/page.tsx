import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Workspace" };

export default function SettingsWorkspacePage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Workspace" description="Nome, identificador e exclusão do workspace." />
      <p className="text-sm text-muted-foreground">Em construção.</p>
    </div>
  );
}
