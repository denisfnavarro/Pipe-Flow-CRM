import type { Lead, LeadDetail, LeadFilters, LeadWithRelations, Paginated } from "@/types/domain";
import { CURRENT_USER_ID, WORKSPACE } from "./seed";
import { delay, nextId, store } from "./store";
import { memberById } from "./workspace";

export const DEFAULT_PER_PAGE = 10;

/** Entrada de criação/edição — o que o formulário coleta, nada além. */
export interface LeadInput {
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  status: Lead["status"];
  ownerId: string;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function decorate(lead: Lead): LeadWithRelations {
  const activities = store.activities.filter((a) => a.leadId === lead.id);
  const lastActivityAt = activities
    .map((a) => a.createdAt)
    .sort()
    .at(-1);

  return {
    ...lead,
    owner: memberById(lead.ownerId),
    dealCount: store.deals.filter((d) => d.leadId === lead.id).length,
    lastActivityAt: lastActivityAt ?? null,
  };
}

export async function listLeads(filters: LeadFilters = {}): Promise<Paginated<LeadWithRelations>> {
  await delay();

  const { q, status, ownerId, period, sort = "createdAt", dir = "desc" } = filters;
  const page = Math.max(1, filters.page ?? 1);
  const perPage = filters.perPage ?? DEFAULT_PER_PAGE;

  let rows = store.leads.filter((lead) => lead.workspaceId === WORKSPACE.id);

  if (q) {
    const needle = normalize(q);
    rows = rows.filter((lead) =>
      [lead.name, lead.email, lead.company].some(
        (field) => field && normalize(field).includes(needle),
      ),
    );
  }

  if (status) rows = rows.filter((lead) => lead.status === status);
  if (ownerId) rows = rows.filter((lead) => lead.ownerId === ownerId);

  if (period) {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    rows = rows.filter((lead) => new Date(lead.createdAt).getTime() >= cutoff);
  }

  const factor = dir === "asc" ? 1 : -1;
  rows = [...rows].sort((a, b) => {
    const left = a[sort] ?? "";
    const right = b[sort] ?? "";
    return String(left).localeCompare(String(right), "pt-BR") * factor;
  });

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, pageCount);
  const items = rows.slice((safePage - 1) * perPage, safePage * perPage).map(decorate);

  return { items, total, page: safePage, perPage, pageCount };
}

export async function getLead(id: string): Promise<LeadDetail | null> {
  await delay();

  const lead = store.leads.find((l) => l.id === id);
  if (!lead) return null;

  const deals = store.deals
    .filter((d) => d.leadId === lead.id)
    .map((deal) => ({
      ...deal,
      owner: memberById(deal.ownerId),
      lead: { id: lead.id, name: lead.name, company: lead.company },
    }));

  const activities = store.activities
    .filter((a) => a.leadId === lead.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((activity) => ({ ...activity, author: memberById(activity.authorId) }));

  return { ...decorate(lead), deals, activities };
}

export async function createLead(input: LeadInput): Promise<Lead> {
  await delay();

  const lead: Lead = {
    id: nextId("lead"),
    workspaceId: WORKSPACE.id,
    createdAt: new Date().toISOString(),
    ...input,
  };

  store.leads.unshift(lead);
  return lead;
}

export async function updateLead(id: string, input: LeadInput): Promise<Lead> {
  await delay();

  const lead = store.leads.find((l) => l.id === id);
  if (!lead) throw new Error("Lead não encontrado");

  Object.assign(lead, input);
  return lead;
}

export async function deleteLead(id: string): Promise<void> {
  await delay();

  const index = store.leads.findIndex((l) => l.id === id);
  if (index === -1) throw new Error("Lead não encontrado");

  store.leads.splice(index, 1);
  // Negócios e atividades órfãos não devem sobreviver ao lead.
  store.deals = store.deals.filter((d) => d.leadId !== id);
  store.activities = store.activities.filter((a) => a.leadId !== id);
}

export async function countLeads(): Promise<number> {
  await delay(10);
  return store.leads.filter((l) => l.workspaceId === WORKSPACE.id).length;
}

export { CURRENT_USER_ID };
