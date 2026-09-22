"use server";

import { revalidatePath } from "next/cache";
import { createDeal, deleteDeal, moveDeal, updateDeal } from "@/lib/data/deals";
import { dealSchema, moveDealSchema } from "@/lib/validations/deal";
import type { DealStage } from "@/types/domain";

export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateBoard(leadId?: string | null) {
  revalidatePath("/pipeline");
  revalidatePath("/dashboard");
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

export async function createDealAction(input: unknown): Promise<ActionResult> {
  const parsed = dealSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await createDeal(parsed.data);
  revalidateBoard(parsed.data.leadId);
  return { ok: true };
}

export async function updateDealAction(id: string, input: unknown): Promise<ActionResult> {
  const parsed = dealSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await updateDeal(id, parsed.data);
  } catch {
    return { ok: false, error: "Não foi possível salvar o negócio" };
  }

  revalidateBoard(parsed.data.leadId);
  return { ok: true };
}

export async function deleteDealAction(id: string): Promise<ActionResult> {
  try {
    await deleteDeal(id);
  } catch {
    return { ok: false, error: "Não foi possível excluir o negócio" };
  }

  revalidateBoard();
  return { ok: true };
}

/**
 * Chamada pelo drag-and-drop. A UI já aplicou a mudança de forma otimista;
 * se esta action falhar, o board faz rollback para o estado anterior.
 */
export async function moveDealAction(
  dealId: string,
  stage: DealStage,
  position: number,
): Promise<ActionResult> {
  const parsed = moveDealSchema.safeParse({ dealId, stage, position });
  if (!parsed.success) return { ok: false, error: "Movimento inválido" };

  try {
    await moveDeal(parsed.data.dealId, parsed.data.stage, parsed.data.position);
  } catch {
    return { ok: false, error: "Não foi possível mover o negócio" };
  }

  revalidateBoard();
  return { ok: true };
}
