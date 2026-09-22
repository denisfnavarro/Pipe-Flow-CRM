import "server-only";

import { requireWorkspace } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Member } from "@/types/domain";

/**
 * Membros do workspace ativo.
 *
 * Alimenta os seletores de responsável nos formulários de lead e de negócio —
 * só é possível atribuir trabalho a quem participa do workspace.
 */
export async function listMembers(): Promise<Member[]> {
  const { workspace } = await requireWorkspace();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("workspace_members")
    .select("role, created_at, profiles (id, full_name, email, avatar_url)")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Não foi possível carregar o time: ${error.message}`);

  return (data ?? []).flatMap((row) => {
    const profile = row.profiles;
    if (!profile) return [];

    return [
      {
        id: profile.id,
        name: profile.full_name || profile.email.split("@")[0],
        email: profile.email,
        avatarUrl: profile.avatar_url,
        role: row.role,
        joinedAt: row.created_at,
      },
    ];
  });
}
