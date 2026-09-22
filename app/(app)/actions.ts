"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { WORKSPACE_COOKIE, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createWorkspaceSchema } from "@/lib/validations/auth";

export type ActionResult<T = void> =
  ({ ok: true } & (T extends void ? object : { data: T })) | { ok: false; error: string };

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/**
 * Troca o workspace ativo.
 *
 * Confere a participação antes de gravar o cookie. Sem essa checagem o cookie
 * não daria acesso a nada (o RLS barra), mas a UI entraria num estado confuso,
 * mostrando um workspace vazio em vez de um erro.
 */
export async function setActiveWorkspaceAction(workspaceId: string): Promise<ActionResult> {
  await requireSession();
  const supabase = createClient();

  const { data } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!data) return { ok: false, error: "Você não participa deste workspace" };

  cookies().set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Cria um workspace. O trigger `on_workspace_created` insere o criador como
 * admin na mesma transação, então não há janela em que o workspace exista sem dono.
 */
export async function createWorkspaceAction(input: unknown): Promise<ActionResult<string>> {
  const user = await requireSession();

  const parsed = createWorkspaceSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  const supabase = createClient();
  const base = slugify(parsed.data.name) || "workspace";

  // O slug é único no banco; tentamos alguns sufixos antes de desistir.
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = attempt === 0 ? base : `${base}-${Math.random().toString(36).slice(2, 6)}`;

    const { data, error } = await supabase
      .from("workspaces")
      .insert({ name: parsed.data.name, slug, owner_id: user.id })
      .select("id")
      .single();

    if (!error && data) {
      await setActiveWorkspaceAction(data.id);
      revalidatePath("/", "layout");
      return { ok: true, data: data.id };
    }

    // 23505 = unique_violation: só o slug colidiu, vale tentar de novo.
    if (error && error.code !== "23505") {
      return { ok: false, error: "Não foi possível criar o workspace" };
    }
  }

  return { ok: false, error: "Não foi possível gerar um identificador para este nome" };
}
