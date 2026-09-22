import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Relatórios" };

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios" description="Desempenho de vendas e exportação de dados." />
      <p className="text-sm text-muted-foreground">Em construção.</p>
    </div>
  );
}
