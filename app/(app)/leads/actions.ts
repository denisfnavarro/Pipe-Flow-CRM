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
export type ActionResult = { ok: true } | { ok: false; error: string };

export async function createLeadAction(input: unknown): Promise<ActionResult> {
  const parsed = leadSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }

  await createLead(parsed.data);
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
