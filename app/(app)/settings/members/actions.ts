"use server";

import { revalidatePath } from "next/cache";
import {
  createInvite,
  removeMember,
  resendInvite,
  revokeInvite,
  updateMemberRole,
} from "@/lib/data/invites";
import { inviteSchema } from "@/lib/validations/auth";
import type { MemberRole } from "@/types/domain";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

/**
 * Traduz o erro para a voz do produto. As mensagens do trigger e das funções
 * Postgres já vêm em português; o resto vira uma frase genérica, porque detalhe
 * de banco não é assunto de quem está na tela.
 */
function toMessage(error: unknown, fallback: string): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("pelo menos um administrador")) {
    return "O workspace precisa de pelo menos um administrador.";
  }
  if (message.includes("já faz parte")) return message;
  return message.startsWith("Não foi possível") ? message : fallback;
}

export async function inviteMemberAction(input: unknown): Promise<ActionResult> {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await createInvite(parsed.data.email, parsed.data.role);
  } catch (error) {
    return { ok: false, error: toMessage(error, "Não foi possível enviar o convite") };
  }

  revalidatePath("/settings/members");
  return { ok: true, message: `Convite enviado para ${parsed.data.email}` };
}

export async function resendInviteAction(inviteId: string): Promise<ActionResult> {
  try {
    await resendInvite(inviteId);
  } catch (error) {
    return { ok: false, error: toMessage(error, "Não foi possível reenviar o convite") };
  }

  revalidatePath("/settings/members");
  return { ok: true, message: "Convite reenviado" };
}

export async function revokeInviteAction(inviteId: string): Promise<ActionResult> {
  try {
    await revokeInvite(inviteId);
  } catch (error) {
    return { ok: false, error: toMessage(error, "Não foi possível revogar o convite") };
  }

  revalidatePath("/settings/members");
  return { ok: true, message: "Convite revogado" };
}

export async function removeMemberAction(userId: string): Promise<ActionResult> {
  try {
    await removeMember(userId);
  } catch (error) {
    return { ok: false, error: toMessage(error, "Não foi possível remover o membro") };
  }

  revalidatePath("/settings/members");
  return { ok: true, message: "Membro removido" };
}

export async function updateMemberRoleAction(
  userId: string,
  role: MemberRole,
): Promise<ActionResult> {
  try {
    await updateMemberRole(userId, role);
  } catch (error) {
    return { ok: false, error: toMessage(error, "Não foi possível alterar o papel") };
  }

  revalidatePath("/settings/members");
  return { ok: true, message: "Papel atualizado" };
}
