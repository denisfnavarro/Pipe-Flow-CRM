import "server-only";

import { requireWorkspace } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  DEAL_STAGES,
  OPEN_STAGES,
  type DashboardMetrics,
  type DealStage,
  type DealWithRelations,
  type UserRef,
} from "@/types/domain";

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

function toUserRef(profile: ProfileRow | null, fallbackId: string): UserRef {
  if (!profile) return { id: fallbackId, name: "Usuário removido", email: "", avatarUrl: null };
  return {
    id: profile.id,
    name: profile.full_name || profile.email.split("@")[0],
    email: profile.email,
    avatarUrl: profile.avatar_url,
  };
}

const EMPTY: DashboardMetrics = {
  totalLeads: 0,
  openDeals: 0,
  pipelineValue: 0,
  conversionRate: 0,
  funnel: DEAL_STAGES.map((stage) => ({ stage, count: 0, value: 0 })),
};

/**
 * Métricas do dashboard, agregadas pelo Postgres.
 *
 * Uma chamada só. Somar em JavaScript exigiria trazer todos os negócios do
 * workspace a cada render — funciona com vinte registros e para de funcionar
 * bem antes dos vinte mil.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const { workspace } = await requireWorkspace();
  const supabase = createClient();

  const { data, error } = await supabase.rpc("dashboard_metrics", { p_workspace: workspace.id });

  if (error) throw new Error(`Não foi possível carregar as métricas: ${error.message}`);
  if (!data) return EMPTY;

  const raw = data as unknown as {
    totalLeads: number;
    openDeals: number;
    pipelineValue: number;
    // `numeric` chega como string no JSON, para não perder precisão.
    conversionRate: number | string;
    funnel: { stage: DealStage; count: number; value: number }[];
  };

  return {
    totalLeads: Number(raw.totalLeads),
    openDeals: Number(raw.openDeals),
    pipelineValue: Number(raw.pipelineValue),
    conversionRate: Number(raw.conversionRate),
    funnel: raw.funnel.map((row) => ({
      stage: row.stage,
      count: Number(row.count),
      value: Number(row.value),
    })),
  };
}

/** Negócios do usuário logado com prazo vencido ou nos próximos sete dias. */
export async function listUpcomingDeals(limit = 6): Promise<DealWithRelations[]> {
  const { user, workspace } = await requireWorkspace();
  const supabase = createClient();

  const horizon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("deals")
    .select(
      `id, workspace_id, title, value, stage, lead_id, owner_id, due_date, position, created_at,
       owner:profiles!deals_owner_id_fkey (id, full_name, email, avatar_url),
       lead:leads (id, name, company)`,
    )
    .eq("workspace_id", workspace.id)
    .eq("owner_id", user.id)
    .in("stage", OPEN_STAGES)
    .not("due_date", "is", null)
    .lte("due_date", horizon)
    .order("due_date", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Não foi possível carregar os prazos: ${error.message}`);

  return (data ?? []).map((row) => {
    const deal = row as unknown as {
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
      owner: ProfileRow | null;
      lead: { id: string; name: string; company: string | null } | null;
    };

    return {
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
      lead: deal.lead,
    };
  });
}
