import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Visão geral do funil, metas e prazos do time." />
      <p className="text-sm text-muted-foreground">Em construção.</p>
    </div>
  );
}
