"use server";

import { requireAdmin } from "@/lib/auth";
import { stripe } from "@/lib/stripe/client";
import { proPriceId } from "@/lib/stripe/plans";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/site";

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

/**
 * Reaproveita o customer da Stripe se o workspace já tiver um.
 *
 * Criar um customer novo a cada checkout faria o mesmo cliente aparecer
 * duplicado no painel e quebraria o Customer Portal, que é por customer.
 */
async function customerFor(workspaceId: string, workspaceName: string, email: string) {
  const supabase = createClient();

  const { data } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (data?.stripe_customer_id) return data.stripe_customer_id;

  const customer = await stripe().customers.create({
    email,
    name: workspaceName,
    // O webhook chega sem contexto de sessão: é por aqui que ele descobre
    // a qual workspace a assinatura pertence.
    metadata: { workspace_id: workspaceId },
  });

  return customer.id;
}

export async function createCheckoutAction(): Promise<CheckoutResult> {
  let workspace;
  let user;

  try {
    ({ workspace, user } = await requireAdmin());
  } catch {
    return { ok: false, error: "Só administradores podem assinar." };
  }

  if (workspace.plan === "pro") {
    return { ok: false, error: "Este workspace já está no plano Pro." };
  }

  try {
    const customer = await customerFor(workspace.id, workspace.name, user.email ?? "");

    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer,
      line_items: [{ price: proPriceId(), quantity: 1 }],
      success_url: `${siteUrl()}/settings/billing?upgrade=sucesso`,
      cancel_url: `${siteUrl()}/settings/billing?upgrade=cancelado`,
      // Repetidos na sessão e na assinatura: o `checkout.session.completed`
      // e o `customer.subscription.*` são eventos diferentes, e ambos precisam
      // saber de qual workspace se trata.
      metadata: { workspace_id: workspace.id },
      subscription_data: { metadata: { workspace_id: workspace.id } },
      allow_promotion_codes: true,
      locale: "pt-BR",
    });

    if (!session.url) return { ok: false, error: "A Stripe não devolveu a URL do checkout." };
    return { ok: true, url: session.url };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível abrir o checkout.",
    };
  }
}

export async function createPortalAction(): Promise<CheckoutResult> {
  let workspace;

  try {
    ({ workspace } = await requireAdmin());
  } catch {
    return { ok: false, error: "Só administradores gerenciam a assinatura." };
  }

  const supabase = createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  if (!data?.stripe_customer_id) {
    return { ok: false, error: "Este workspace ainda não tem assinatura." };
  }

  try {
    const session = await stripe().billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: `${siteUrl()}/settings/billing`,
      locale: "pt-BR",
    });

    return { ok: true, url: session.url };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Não foi possível abrir o portal.",
    };
  }
}
