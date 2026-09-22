import "server-only";

import { requireWorkspace } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Deal, DealStage, DealWithRelations, UserRef } from "@/types/domain";

export interface DealInput {
  title: string;
  /** Centavos. */
  value: number;
  stage: DealStage;
  leadId: string | null;
  ownerId: string;
  dueDate: string | null;
}

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface DealRow {
  id: string;
  workspace_id: string;
  title: string;
  value: number;
  stage: DealStage;
  lead_id: string | null;
  owner_id: string;
  due_date: string | null;
  position: number;
  created_at: string;
}

const COLUMNS =
  "id, workspace_id, title, value, stage, lead_id, owner_id, due_date, position, created_at";

const EMBEDS =
  "owner:profiles!deals_owner_id_fkey (id, full_name, email, avatar_url), lead:leads (id, name, company)";

function toUserRef(profile: ProfileRow | null, fallbackId: string): UserRef {
  if (!profile) return { id: fallbackId, name: "Usuário removido", email: "", avatarUrl: null };
  return {
    id: profile.id,
    name: profile.full_name || profile.email.split("@")[0],
    email: profile.email,
    avatarUrl: profile.avatar_url,
  };
}

function toDeal(row: DealRow): Deal {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    value: row.value,
    stage: row.stage,
    leadId: row.lead_id,
    ownerId: row.owner_id,
    dueDate: row.due_date,
    position: row.position,
    createdAt: row.created_at,
  };
}

export async function listDeals(): Promise<DealWithRelations[]> {
  const { workspace } = await requireWorkspace();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("deals")
    .select(`${COLUMNS}, ${EMBEDS}`)
    .eq("workspace_id", workspace.id)
    .order("stage", { ascending: true })
    .order("position", { ascending: true });

  if (error) throw new Error(`Não foi possível listar os negócios: ${error.message}`);

  return (data ?? []).map((row) => {
    const deal = row as unknown as DealRow & {
      owner: ProfileRow | null;
      lead: { id: string; name: string; company: string | null } | null;
    };

    return {
      ...toDeal(deal),
      owner: toUserRef(deal.owner, deal.owner_id),
      lead: deal.lead,
    };
  });
}

export async function createDeal(input: DealInput): Promise<Deal> {
  const { workspace } = await requireWorkspace();
  const supabase = createClient();

  // Card novo entra no fim da coluna.
  const { count } = await supabase
    .from("deals")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .eq("stage", input.stage);

  const { data, error } = await supabase
    .from("deals")
    .insert({
      workspace_id: workspace.id,
      title: input.title,
      value: input.value,
      stage: input.stage,
      lead_id: input.leadId,
      owner_id: input.ownerId,
      due_date: input.dueDate,
      position: count ?? 0,
    })
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`Não foi possível criar o negócio: ${error.message}`);
  return toDeal(data as unknown as DealRow);
}

export async function updateDeal(id: string, input: DealInput): Promise<Deal> {
  const { workspace } = await requireWorkspace();
  const supabase = createClient();

  const { data: current, error: readError } = await supabase
    .from("deals")
    .select("stage")
    .eq("workspace_id", workspace.id)
    .eq("id", id)
    .maybeSingle();

  if (readError) throw new Error(`Não foi possível salvar o negócio: ${readError.message}`);
  if (!current) throw new Error("Negócio não encontrado");

  const { data, error } = await supabase
    .from("deals")
    .update({
      title: input.title,
      value: input.value,
      stage: input.stage,
      lead_id: input.leadId,
      owner_id: input.ownerId,
      due_date: input.dueDate,
    })
    .eq("workspace_id", workspace.id)
    .eq("id", id)
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`Não foi possível salvar o negócio: ${error.message}`);

  // Mudar de etapa pelo formulário joga o card para o fim da nova coluna —
  // e a função cuida de renumerar a coluna de origem.
  if (current.stage !== input.stage) {
    await moveDeal(id, input.stage, Number.MAX_SAFE_INTEGER);
  }

  return toDeal(data as unknown as DealRow);
}

export async function deleteDeal(id: string): Promise<void> {
  const { workspace } = await requireWorkspace();
  const supabase = createClient();

  const { error } = await supabase
    .from("deals")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", id);

  if (error) throw new Error(`Não foi possível excluir o negócio: ${error.message}`);
}

/**
 * Move um card no Kanban.
 *
 * Delega à função `move_deal`, que faz origem e destino na mesma transação com
 * as duas colunas travadas. Fazer isso em UPDATEs separados daqui deixaria
 * janelas com posição duplicada visíveis para quem estivesse no mesmo board.
 */
export async function moveDeal(dealId: string, stage: DealStage, position: number): Promise<void> {
  await requireWorkspace();
  const supabase = createClient();

  // A função clampa a posição; `MAX_SAFE_INTEGER` não cabe em `integer`.
  const safePosition = Math.min(Math.max(position, 0), 1_000_000);

  const { error } = await supabase.rpc("move_deal", {
    p_deal_id: dealId,
    p_stage: stage,
    p_position: safePosition,
  });

  if (error) throw new Error(`Não foi possível mover o negócio: ${error.message}`);
}
