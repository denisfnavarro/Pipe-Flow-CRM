import { Banknote, KanbanSquare, Target, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { MetricCard } from "@/components/dashboard/metric-card";
import { UpcomingDeals } from "@/components/dashboard/upcoming-deals";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney, formatPercent } from "@/lib/format";
import { getDashboardMetrics, listUpcomingDeals } from "@/lib/mock/dashboard";
import { getCurrentMember } from "@/lib/mock/workspace";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const [metrics, upcoming, member] = await Promise.all([
    getDashboardMetrics(),
    listUpcomingDeals(),
    getCurrentMember(),
  ]);

  const closed = metrics.funnel
    .filter((row) => row.stage === "won" || row.stage === "lost")
    .reduce((sum, row) => sum + row.count, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Olá, ${member.name.split(" ")[0]}`}
        description="Visão geral do funil, metas e prazos do time."
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/pipeline">Ver pipeline</Link>
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total de leads"
          value={String(metrics.totalLeads)}
          hint="Contatos no workspace"
          icon={Users}
          tone="primary"
        />
        <MetricCard
          label="Negócios abertos"
          value={String(metrics.openDeals)}
          hint="Fora de Ganho e Perdido"
          icon={KanbanSquare}
          tone="accent"
        />
        <MetricCard
          label="Valor do pipeline"
          value={formatMoney(metrics.pipelineValue)}
          hint="Soma dos negócios em aberto"
          icon={Banknote}
          tone="success"
        />
        <MetricCard
          label="Taxa de conversão"
          value={formatPercent(metrics.conversionRate)}
          hint={`${closed} negócios fechados`}
          icon={Target}
          tone="warning"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Funil de vendas</CardTitle>
            <p className="text-xs text-muted-foreground">Valor acumulado por etapa.</p>
          </CardHeader>
          <CardContent className="pl-0">
            <FunnelChart funnel={metrics.funnel} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Meus prazos próximos</CardTitle>
            <p className="text-xs text-muted-foreground">
              Negócios seus vencendo nos próximos sete dias.
            </p>
          </CardHeader>
          <CardContent>
            <UpcomingDeals deals={upcoming} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
