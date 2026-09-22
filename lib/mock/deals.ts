import type { Deal, DealStage, DealWithRelations } from "@/types/domain";
import { WORKSPACE } from "./seed";
import { delay, nextId, store } from "./store";
import { memberById } from "./workspace";

export interface DealInput {
  title: string;
  /** Centavos. */
  value: number;
  stage: DealStage;
  leadId: string | null;
  ownerId: string;
  dueDate: string | null;
}

function decorate(deal: Deal): DealWithRelations {
  const lead = deal.leadId ? store.leads.find((l) => l.id === deal.leadId) : undefined;
  return {
    ...deal,
    owner: memberById(deal.ownerId),
    lead: lead ? { id: lead.id, name: lead.name, company: lead.company } : null,
  };
}

export async function listDeals(): Promise<DealWithRelations[]> {
  await delay();
  return store.deals
    .filter((d) => d.workspaceId === WORKSPACE.id)
    .sort((a, b) => a.position - b.position)
    .map(decorate);
}

export async function createDeal(input: DealInput): Promise<Deal> {
  await delay();

  const stageDeals = store.deals.filter((d) => d.stage === input.stage);
  const deal: Deal = {
    id: nextId("deal"),
    workspaceId: WORKSPACE.id,
    position: stageDeals.length,
    createdAt: new Date().toISOString(),
    ...input,
  };

  store.deals.push(deal);
  return deal;
}

export async function updateDeal(id: string, input: DealInput): Promise<Deal> {
  await delay();

  const deal = store.deals.find((d) => d.id === id);
  if (!deal) throw new Error("Negócio não encontrado");

  // Mudar de etapa pelo formulário joga o card para o fim da nova coluna.
  if (input.stage !== deal.stage) {
    deal.position = store.deals.filter((d) => d.stage === input.stage).length;
  }

  Object.assign(deal, input);
  return deal;
}

export async function deleteDeal(id: string): Promise<void> {
  await delay();

  const index = store.deals.findIndex((d) => d.id === id);
  if (index === -1) throw new Error("Negócio não encontrado");
  store.deals.splice(index, 1);
}

/**
 * Move um card no Kanban. Reindexa a coluna de origem e a de destino para que
 * as posições continuem densas (0..n-1) — é o mesmo contrato que a transação
 * no Postgres vai cumprir na M9.
 */
export async function moveDeal(dealId: string, stage: DealStage, position: number): Promise<void> {
  await delay(80);

  const deal = store.deals.find((d) => d.id === dealId);
  if (!deal) throw new Error("Negócio não encontrado");

  const from = deal.stage;
  deal.stage = stage;

  const column = store.deals
    .filter((d) => d.stage === stage && d.id !== dealId)
    .sort((a, b) => a.position - b.position);

  column.splice(Math.max(0, Math.min(position, column.length)), 0, deal);
  column.forEach((d, index) => {
    d.position = index;
  });

  if (from !== stage) {
    store.deals
      .filter((d) => d.stage === from)
      .sort((a, b) => a.position - b.position)
      .forEach((d, index) => {
        d.position = index;
      });
  }
}
