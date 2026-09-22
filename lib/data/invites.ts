import "server-only";

import { randomBytes } from "node:crypto";
import { requireAdmin, requireSession } from "@/lib/auth";
import { resend, fromAddress } from "@/lib/resend/client";
import { inviteEmail } from "@/lib/resend/templates/invite";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/types/domain";

export type InviteStatus = "pending" | "accepted" | "revoked" | "expired";

export interface Invite {
  id: string;
  email: string;
  role: MemberRole;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
  invitedBy: string;
}

export interface InvitePreview {
  email: string;
  role: MemberRole;
  status: InviteStatus;
  workspaceName: string;
  invitedBy: string;
}

const EXPIRY_DAYS = 7;

/** 32 bytes de aleatoriedade criptográfica: o token é a única credencial do convite. */
function newToken(): string {
  return randomBytes(32).toString("base64url");
}

function expiresAt(): string {
  return new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export async function listInvites(): Promise<Invite[]> {
  const { workspace } = await requireAdmin();
  const supabase = createClient();

  const { data, error } = await supabase
    .from("invites")
    .select("id, email, role, status, expires_at, created_at, invited_by")
    .eq("workspace_id", workspace.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Não foi possível carregar os convites: ${error.message}`);

  const now = Date.now();
  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    role: row.role,
    // O status expirado é derivado na leitura; o banco só o grava no aceite.
    status:
      row.status === "pending" && new Date(row.expires_at).getTime() < now
        ? "expired"
        : (row.status as InviteStatus),
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    invitedBy: row.invited_by,
  }));
}

/** Dispara o e-mail. Separado do banco para que uma falha de envio não derrube a criação. */
async function sendInviteEmail(params: {
  to: string;
  workspaceName: string;
  invitedByName: string;
  role: MemberRole;
  token: string;
  expiresAt: string;
}): Promise<void> {
  const { subject, html, text } = inviteEmail({
    workspaceName: params.workspaceName,
    invitedByName: params.invitedByName,
    role: params.role,
    token: params.token,
    expiresAt: params.expiresAt,
  });

  const { error } = await resend().emails.send({
    from: fromAddress(),
    to: params.to,
    subject,
    html,
    text,
  });

  if (error) throw new Error(error.message);
}

export async function createInvite(email: string, role: MemberRole): Promise<void> {
  const { user, workspace } = await requireAdmin();
  const supabase = createClient();

  const normalized = email.trim().toLowerCase();

  // Convidar quem já está dentro só geraria confusão.
  const { data: existing } = await supabase
    .from("workspace_members")
    .select("user_id, profiles!inner (email)")
    .eq("workspace_id", workspace.id)
    .eq("profiles.email", normalized)
    .maybeSingle();

  if (existing) throw new Error("Esta pessoa já faz parte do workspace");

  const token = newToken();
  const expires = expiresAt();

  // Um convite pendente por e-mail, garantido pelo índice parcial da M6.
  // Reconvidar substitui o pendente em vez de acumular.
  await supabase
    .from("invites")
    .update({ status: "revoked" })
    .eq("workspace_id", workspace.id)
    .eq("status", "pending")
    .ilike("email", normalized);

  const { error } = await supabase.from("invites").insert({
    workspace_id: workspace.id,
    email: normalized,
    role,
    token,
    invited_by: user.id,
    expires_at: expires,
  });

  if (error) throw new Error(`Não foi possível criar o convite: ${error.message}`);

  await sendInviteEmail({
    to: normalized,
    workspaceName: workspace.name,
    invitedByName: (user.user_metadata?.full_name as string) ?? user.email ?? "Alguém",
    role,
    token,
    expiresAt: expires,
  });
}

/** Reenviar gera token novo: o antigo pode ter vazado em uma caixa errada. */
export async function resendInvite(inviteId: string): Promise<void> {
  const { user, workspace } = await requireAdmin();
  const supabase = createClient();

  const token = newToken();
  const expires = expiresAt();

  const { data, error } = await supabase
    .from("invites")
    .update({ token, expires_at: expires, status: "pending" })
    .eq("workspace_id", workspace.id)
    .eq("id", inviteId)
    .select("email, role")
    .single();

  if (error) throw new Error(`Não foi possível reenviar o convite: ${error.message}`);

  await sendInviteEmail({
    to: data.email,
    workspaceName: workspace.name,
    invitedByName: (user.user_metadata?.full_name as string) ?? user.email ?? "Alguém",
    role: data.role,
    token,
    expiresAt: expires,
  });
}

export async function revokeInvite(inviteId: string): Promise<void> {
  const { workspace } = await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase
    .from("invites")
    .update({ status: "revoked" })
    .eq("workspace_id", workspace.id)
    .eq("id", inviteId);

  if (error) throw new Error(`Não foi possível revogar o convite: ${error.message}`);
}

/** Dados da tela de aceite. Não exige participação no workspace. */
export async function getInvitePreview(token: string): Promise<InvitePreview | null> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("invite_preview", { p_token: token });
  if (error || !data) return null;

  const raw = data as unknown as {
    email: string;
    role: MemberRole;
    status: InviteStatus;
    workspaceName: string;
    invitedBy: string | null;
  };

  return { ...raw, invitedBy: raw.invitedBy ?? "Alguém" };
}

/** Aceita o convite e devolve o workspace de destino. */
export async function acceptInvite(token: string): Promise<string> {
  await requireSession();
  const supabase = createClient();

  const { data, error } = await supabase.rpc("accept_invite", { p_token: token });
  if (error) throw new Error(error.message);

  return data as unknown as string;
}

export async function removeMember(userId: string): Promise<void> {
  const { workspace } = await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase
    .from("workspace_members")
    .delete()
    .eq("workspace_id", workspace.id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}

export async function updateMemberRole(userId: string, role: MemberRole): Promise<void> {
  const { workspace } = await requireAdmin();
  const supabase = createClient();

  const { error } = await supabase
    .from("workspace_members")
    .update({ role })
    .eq("workspace_id", workspace.id)
    .eq("user_id", userId);

  if (error) throw new Error(error.message);
}
