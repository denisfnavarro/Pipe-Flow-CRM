"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { WORKSPACE_COOKIE } from "@/lib/auth";
import { acceptInvite } from "@/lib/data/invites";

export type AcceptResult = { ok: true } | { ok: false; error: string };

export async function acceptInviteAction(token: string): Promise<AcceptResult> {
  let workspaceId: string;

  try {
    workspaceId = await acceptInvite(token);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível aceitar o convite",
    };
  }

  // Entrar já dentro do workspace certo — e não no primeiro da lista.
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
