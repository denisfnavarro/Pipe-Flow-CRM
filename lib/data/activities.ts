import "server-only";

import { requireWorkspace } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Activity, ActivityType, ActivityWithAuthor, UserRef } from "@/types/domain";

export interface ActivityInput {
  leadId: string;
  type: ActivityType;
  description: string;
}

interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface ActivityRow {
  id: string;
  workspace_id: string;
  lead_id: string;
  type: ActivityType;
  description: string;
  author_id: string;
  created_at: string;
}

const COLUMNS = "id, workspace_id, lead_id, type, description, author_id, created_at";
const AUTHOR_EMBED = "author:profiles!activities_author_id_fkey (id, full_name, email, avatar_url)";

function toUserRef(profile: ProfileRow | null, fallbackId: string): UserRef {
  if (!profile) return { id: fallbackId, name: "Usuário removido", email: "", avatarUrl: null };
  return {
    id: profile.id,
    name: profile.full_name || profile.email.split("@")[0],
    email: profile.email,
    avatarUrl: profile.avatar_url,
  };
}

function toActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    leadId: row.lead_id,
    type: row.type,
    description: row.description,
    authorId: row.author_id,
    createdAt: row.created_at,
  };
}

export async function listActivities(leadId: string): Promise<ActivityWithAuthor[]> {
  const { workspace } = await requireWorkspace();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("activities")
    .select(`${COLUMNS}, ${AUTHOR_EMBED}`)
    .eq("workspace_id", workspace.id)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Não foi possível carregar as atividades: ${error.message}`);

  return (data ?? []).map((row) => {
    const activity = row as unknown as ActivityRow & { author: ProfileRow | null };
    return { ...toActivity(activity), author: toUserRef(activity.author, activity.author_id) };
  });
}

/**
 * Registra uma atividade.
 *
 * O autor vem da sessão, nunca do corpo da requisição — e a policy
 * `activities_insert` da M6 exige `author_id = auth.uid()`, então nem um
 * cliente adulterado conseguiria assinar em nome de outra pessoa.
 */
export async function createActivity(input: ActivityInput): Promise<Activity> {
  const { user, workspace } = await requireWorkspace();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("activities")
    .insert({
      workspace_id: workspace.id,
      lead_id: input.leadId,
      type: input.type,
      description: input.description,
      author_id: user.id,
    })
    .select(COLUMNS)
    .single();

  if (error) throw new Error(`Não foi possível registrar a atividade: ${error.message}`);
  return toActivity(data as unknown as ActivityRow);
}

/** Só o autor apaga o que registrou — é o que a policy `activities_delete_author` impõe. */
export async function deleteActivity(id: string): Promise<void> {
  const { workspace } = await requireWorkspace();
  const supabase = createClient();

  const { error } = await supabase
    .from("activities")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("id", id);

  if (error) throw new Error(`Não foi possível excluir a atividade: ${error.message}`);
}
