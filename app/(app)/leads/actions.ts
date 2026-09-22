"use server";

import { revalidatePath } from "next/cache";
import { createActivity } from "@/lib/data/activities";
import { createLead, deleteLead, updateLead } from "@/lib/data/leads";
import { activitySchema } from "@/lib/validations/activity";
import { leadSchema } from "@/lib/validations/lead";

/**
 * Resultado uniforme das Server Actions: a UI decide entre toast de sucesso e
 * de erro sem precisar de try/catch em cada formulário.
 */
export type ActionResult =
  | { ok: true }
  /** `paywall` faz a UI oferecer o upgrade em vez de só mostrar o erro. */
  | { ok: false; error: string; paywall?: boolean };

/** Os limites do plano vêm de um trigger no banco, com mensagem já em português. */
function isPlanLimit(error: unknown): boolean {
  return error instanceof Error && error.message.includes("plano Free permite");
}

function describe(error: unknown, fallback: string): { error: string; paywall?: boolean } {
  if (isPlanLimit(error)) {
    const message = (error as Error).message;
    return { error: message.slice(message.indexOf("O plano")), paywall: true };
  }
  return { error: fallback };
}

export async function createLeadAction(input: unknown): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await createLead(parsed.data);
  } catch (error) {
    return { ok: false, ...describe(error, "Não foi possível criar o lead") };
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function updateLeadAction(id: string, input: unknown): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  try {
    await updateLead(id, parsed.data);
  } catch {
    return { ok: false, error: "Não foi possível salvar o lead" };
  }

  revalidatePath("/leads");
  revalidatePath(`/leads/${id}`);
  return { ok: true };
}

export async function deleteLeadAction(id: string): Promise<ActionResult> {
  try {
    await deleteLead(id);
  } catch {
    return { ok: false, error: "Não foi possível excluir o lead" };
  }

  revalidatePath("/leads");
  revalidatePath("/dashboard");
  revalidatePath("/pipeline");
  return { ok: true };
}

export async function createActivityAction(input: unknown): Promise<ActionResult> {
  const parsed = activitySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await createActivity(parsed.data);
  revalidatePath(`/leads/${parsed.data.leadId}`);
  return { ok: true };
}
