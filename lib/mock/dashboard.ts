import {
  DEAL_STAGES,
  OPEN_STAGES,
  type DashboardMetrics,
  type DealWithRelations,
} from "@/types/domain";
import { CURRENT_USER_ID, WORKSPACE } from "./seed";
import { delay, store } from "./store";
import { memberById } from "./workspace";

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  await delay();

  const deals = store.deals.filter((d) => d.workspaceId === WORKSPACE.id);
  const open = deals.filter((d) => OPEN_STAGES.includes(d.stage));
  const won = deals.filter((d) => d.stage === "won").length;
  const lost = deals.filter((d) => d.stage === "lost").length;
  const closed = won + lost;

  return {
    totalLeads: store.leads.filter((l) => l.workspaceId === WORKSPACE.id).length,
    openDeals: open.length,
    pipelineValue: open.reduce((sum, d) => sum + d.value, 0),
    conversionRate: closed === 0 ? 0 : won / closed,
    funnel: DEAL_STAGES.map((stage) => {
      const rows = deals.filter((d) => d.stage === stage);
      return {
        stage,
        count: rows.length,
        value: rows.reduce((sum, d) => sum + d.value, 0),
      };
    }),
  };
}

/** Negócios do usuário logado com prazo vencido ou nos próximos 7 dias. */
export async function listUpcomingDeals(limit = 6): Promise<DealWithRelations[]> {
  await delay();

  const horizon = Date.now() + 7 * 24 * 60 * 60 * 1000;

  return store.deals
    .filter(
      (d) =>
        d.ownerId === CURRENT_USER_ID &&
        d.dueDate !== null &&
        OPEN_STAGES.includes(d.stage) &&
        new Date(d.dueDate).getTime() <= horizon,
    )
    .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
    .slice(0, limit)
    .map((deal) => {
      const lead = deal.leadId ? store.leads.find((l) => l.id === deal.leadId) : undefined;
      return {
        ...deal,
        owner: memberById(deal.ownerId),
        lead: lead ? { id: lead.id, name: lead.name, company: lead.company } : null,
      };
    });
}
