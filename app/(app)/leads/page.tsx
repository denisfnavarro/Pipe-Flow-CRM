import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Leads" };

export default function LeadsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Leads"
        description="Todos os contatos do workspace, com busca e filtros."
      />
      <p className="text-sm text-muted-foreground">Em construção.</p>
    </div>
  );
}
