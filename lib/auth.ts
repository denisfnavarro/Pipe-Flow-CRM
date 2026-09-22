import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole, Workspace } from "@/types/domain";

/** Cookie que guarda qual workspace está ativo na sessão do navegador. */
export const WORKSPACE_COOKIE = "pipeflow_workspace";

export interface ActiveWorkspace extends Workspace {
  role: MemberRole;
}

/**
 * Sessão obrigatória.
 *
 * Usa `getUser()`, não `getSession()`: só o primeiro revalida o token contra o
 * servidor de Auth. O middleware já barrou o visitante, mas toda Server Action
 * repete a checagem — defesa em profundidade, porque uma action é um endpoint
 * público como qualquer outro.
 */
export async function requireSession(): Promise<User> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  return user;
}

/**
 * Workspaces de que o usuário participa, do mais antigo para o mais novo.
 *
 * O filtro por `user_id` é obrigatório: o RLS deixa a pessoa enxergar todos os
 * membros dos workspaces de que participa, então sem ele viriam também as
 * participações dos colegas — o mesmo workspace repetido, com o papel errado.
 */
async function fetchMemberships(userId: string): Promise<ActiveWorkspace[]> {
  const supabase = createClient();

  const { data } = await supabase
    .from("workspace_members")
    .select("role, workspaces (id, name, slug, plan, owner_id)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  return (data ?? []).flatMap((row) => {
    const workspace = row.workspaces;
    if (!workspace) return [];

    return [
      {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        plan: workspace.plan,
        ownerId: workspace.owner_id,
        role: row.role,
      },
    ];
  });
}

/** Lista os workspaces do usuário para o seletor da barra lateral. */
export async function listMyWorkspaces(): Promise<ActiveWorkspace[]> {
  const user = await requireSession();
  return fetchMemberships(user.id);
}

/**
 * Workspace ativo do usuário.
 *
 * O cookie é só uma preferência: a lista vem filtrada pelas participações
 * reais, então apontar o cookie para um workspace alheio não leva a lugar
 * nenhum. Quem não tem workspace nenhum vai para o onboarding.
 */
export async function requireWorkspace(): Promise<{ user: User; workspace: ActiveWorkspace }> {
  const user = await requireSession();
  const workspaces = await fetchMemberships(user.id);

  if (workspaces.length === 0) redirect("/onboarding");

  const preferred = cookies().get(WORKSPACE_COOKIE)?.value;
  const workspace = workspaces.find((row) => row.id === preferred) ?? workspaces[0];

  return { user, workspace };
}

/** Barra quem não é admin. Usar em toda action de workspace, time e plano. */
export async function requireAdmin(): Promise<{ user: User; workspace: ActiveWorkspace }> {
  const context = await requireWorkspace();
  if (context.workspace.role !== "admin") {
    throw new Error("Esta ação exige permissão de administrador");
  }
  return context;
}
