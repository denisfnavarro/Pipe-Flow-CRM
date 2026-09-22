import type { Metadata } from "next";
import { NewDealButton } from "@/components/pipeline/new-deal-button";
import { PipelineBoard } from "@/components/pipeline/pipeline-board";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { listDeals } from "@/lib/mock/deals";
import { listLeads } from "@/lib/mock/leads";
import { listMembers } from "@/lib/mock/workspace";
import { OPEN_STAGES } from "@/types/domain";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const [deals, members, leadPage] = await Promise.all([
    listDeals(),
    listMembers(),
    // O select do formulário precisa de todos os leads, não só da primeira página.
    listLeads({ perPage: 1000, sort: "name", dir: "asc" }),
  ]);

  const leads = leadPage.items.map((lead) => ({
    id: lead.id,
    name: lead.name,
    company: lead.company,
  }));

  const openValue = deals
    .filter((deal) => OPEN_STAGES.includes(deal.stage))
    .reduce((sum, deal) => sum + deal.value, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pipeline"
        description="Arraste os cards entre as etapas para atualizar o funil."
        action={<NewDealButton members={members} leads={leads} />}
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">
          <span className="font-mono tabular-nums text-foreground">{deals.length}</span> negócios
        </span>
        <span className="text-muted-foreground">
          Em aberto: <Money cents={openValue} className="text-foreground" />
        </span>
      </div>

      <PipelineBoard deals={deals} members={members} leads={leads} />
    </div>
  );
}
