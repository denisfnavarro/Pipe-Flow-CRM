import "server-only";

import { requireWorkspace } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  Lead,
  LeadDetail,
  LeadFilters,
  LeadWithRelations,
  Paginated,
  UserRef,
} from "@/types/domain";

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

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface LeadRow {
  id: string;
  workspace_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  status: Lead["status"];
  owner_id: string;
  created_at: string;
}

const LEAD_COLUMNS =
  "id, workspace_id, name, email, phone, company, title, status, owner_id, created_at";

const OWNER_EMBED = "owner:profiles!leads_owner_id_fkey (id, full_name, email, avatar_url)";

function toUserRef(profile: ProfileRow | null, fallbackId: string): UserRef {
  if (!profile) return { id: fallbackId, name: "Usuário removido", email: "", avatarUrl: null };
  return {
    id: profile.id,
    name: profile.full_name || profile.email.split("@")[0],
    email: profile.email,
    avatarUrl: profile.avatar_url,
  };
}

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    title: row.title,
    status: row.status,
    ownerId: row.owner_id,
    createdAt: row.created_at,
  };
}

/**
 * Normaliza o termo de busca do mesmo jeito que a coluna gerada `search_text`:
 * minúsculas e sem acento. Sem isso, procurar "Logística" não acharia nada.
 */
function normalizeSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

/** Neutraliza os curingas do LIKE para que o usuário busque texto, não padrão. */
function escapeLike(value: string): string {
  return value.replace(/[%_\\]/g, (match) => `\\${match}`);
}

/** Do campo do domínio para a coluna do banco. */
const SORT_COLUMNS: Record<NonNullable<LeadFilters["sort"]>, string> = {
  name: "name",
  company: "company",
  status: "status",
  createdAt: "created_at",
};

export async function listLeads(filters: LeadFilters = {}): Promise<Paginated<LeadWithRelations>> {
  const { workspace } = await requireWorkspace();
  const supabase = createClient();

  const { q, status, ownerId, period, sort = "createdAt", dir = "desc" } = filters;
  const page = Math.max(1, filters.page ?? 1);
  const perPage = filters.perPage ?? DEFAULT_PER_PAGE;

  let query = supabase
    .from("leads")
    .select(`${LEAD_COLUMNS}, ${OWNER_EMBED}, deals (count), activities (created_at)`, {
      count: "exact",
    })
    .eq("workspace_id", workspace.id);

  if (q) query = query.ilike("search_text", `%${escapeLike(normalizeSearch(q))}%`);
  if (status) query = query.eq("status", status);
  if (ownerId) query = query.eq("owner_id", ownerId);

  if (period) {
    const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    query = query.gte("created_at", cutoff);
  }

  // Uma primeira consulta só para saber quantas páginas existem: pedir um
  // `range` além do fim devolve lista vazia, e a tela ficaria em branco se o
  // usuário estivesse na página 3 e apagasse os registros dela.
  const { count: total = 0 } = await query.range(0, 0);
  const pageCount = Math.max(1, Math.ceil((total ?? 0) / perPage));
  const safePage = Math.min(page, pageCount);
  const from = (safePage - 1) * perPage;

  const { data, error } = await query
    .order(SORT_COLUMNS[sort], { ascending: dir === "asc" })
    .order("id", { ascending: true })
    .order("created_at", { referencedTable: "activities", ascending: false })
    .limit(1, { referencedTable: "activities" })
    .range(from, from + perPage - 1);

  if (error) throw new Error(`Não foi possível listar os leads: ${error.message}`);

  const items = (data ?? []).map((row) => {
    const lead = row as unknown as LeadRow & {
      owner: ProfileRow | null;
      deals: { count: number }[];
      activities: { created_at: string }[];
    };

    return {
      ...toLead(lead),
      owner: toUserRef(lead.owner, lead.owner_id),
      dealCount: lead.deals[0]?.count ?? 0,
      lastActivityAt: lead.activities[0]?.created_at ?? null,
    };
  });

  return { items, total: total ?? 0, page: safePage, perPage, pageCount };
}

export async function getLead(id: string): Promise<LeadDetail | null> {
  const { workspace } = await requireWorkspace();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("leads")
    .select(
      `${LEAD_COLUMNS},
       ${OWNER_EMBED},
       deals (
         id, workspace_id, title, value, stage, lead_id, owner_id, due_date, position, created_at,
         owner:profiles!deals_owner_id_fkey (id, full_name, email, avatar_url)
       ),
       activities (
         id, workspace_id, lead_id, type, description, author_id, created_at,
         author:profiles!activities_author_id_fkey (id, full_name, email, avatar_url)
       )`,
    )
    .eq("workspace_id", workspace.id)
    .eq("id", id)
    .order("created_at", { referencedTable: "activities", ascending: false })
    .maybeSingle();

  // PGRST116 = nenhuma linha; é o caso de "não encontrado", não de falha.
  if (error && error.code !== "PGRST116") {
    throw new Error(`Não foi possível carregar o lead: ${error.message}`);
  }
  if (!data) return null;

  const row = data as unknown as LeadRow & {
    owner: ProfileRow | null;
    deals: {
      id: string;
      workspace_id: string;
      title: string;
      value: number;
      stage: LeadDetail["deals"][number]["stage"];
      lead_id: string | null;
      owner_id: string;
      due_date: string | null;
      position: number;
      created_at: string;
      owner: ProfileRow | null;
    }[];
    activities: {
      id: string;
      workspace_id: string;
      lead_id: string;
      type: LeadDetail["activities"][number]["type"];
      description: string;
      author_id: string;
      created_at: string;
      author: ProfileRow | null;
    }[];
  };

  const lead = toLead(row);

  return {
    ...lead,
    owner: toUserRef(row.owner, row.owner_id),
    dealCount: row.deals.length,
    lastActivityAt: row.activities[0]?.created_at ?? null,
    deals: row.deals
      .sort((a, b) => a.position - b.position)
      .map((deal) => ({
        id: deal.id,
        workspaceId: deal.workspace_id,
        title: deal.title,
        value: deal.value,
        stage: deal.stage,
        leadId: deal.lead_id,
        ownerId: deal.owner_id,
        dueDate: deal.due_date,
        position: deal.position,
        createdAt: deal.created_at,
        owner: toUserRef(deal.owner, deal.owner_id),
        lead: { id: lead.id, name: lead.name, company: lead.company },
      })),
    activities: row.activities.map((activity) => ({
      id: activity.id,
      workspaceId: activity.workspace_id,
      leadId: activity.lead_id,
      type: activity.type,
      description: activity.description,
      authorId: activity.author_id,
      createdAt: activity.created_at,
      author: toUserRef(activity.author, activity.author_id),
    })),
  };
}

export async function createLead(input: LeadInput): Promise<Lead> {
  const { workspace } = await requireWorkspace();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("leads")
    .insert({
      workspace_id: workspace.id,
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      title: input.title,
      status: input.status,
      owner_id: input.ownerId,
    })
    .select(LEAD_COLUMNS)
    .single();

  if (error) throw new Error(`Não foi possível criar o lead: ${error.message}`);
  return toLead(data as unknown as LeadRow);
}

export async function updateLead(id: string, input: LeadInput): Promise<Lead> {
  const { workspace } = await requireWorkspace();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("leads")
    .update({
      name: input.name,
      email: input.email,
      phone: input.phone,
      company: input.company,
      title: input.title,
      status: input.status,
      owner_id: input.ownerId,
    })
    .eq("workspace_id", workspace.id)
    .eq("id", id)
    .select(LEAD_COLUMNS)
    .single();

  if (error) throw new Error(`Não foi possível salvar o lead: ${error.message}`);
  return toLead(data as unknown as LeadRow);
}

export async function deleteLead(id: string): Promise<void> {
  const { workspace } = await requireWorkspace();
  const supabase = createClient();

  // Atividades caem por cascade e negócios ficam com `lead_id` nulo, conforme
  // as chaves estrangeiras declaradas na migration inicial.
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", id);

  if (error) throw new Error(`Não foi possível excluir o lead: ${error.message}`);
}

export async function countLeads(): Promise<number> {
  const { workspace } = await requireWorkspace();
  const supabase = createClient();

  const { count } = await supabase
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  return count ?? 0;
}
