import { BarChart3 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Relatórios" };

// Pós-MVP: vira a branch `feat/reports` quando priorizado (ver ROADMAP).
export default function ReportsPage() {
  return (
    <div className="space-y-5">
      <PageHeader title="Relatórios" description="Desempenho de vendas e exportação de dados." />
      <EmptyState
        icon={BarChart3}
        title="Relatórios em breve"
        description="O funil de vendas e as métricas do período já estão no dashboard. A exportação em CSV e XLSX chega depois do MVP."
        action={
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard">Ver o dashboard</Link>
          </Button>
        }
      />
    </div>
  );
}
