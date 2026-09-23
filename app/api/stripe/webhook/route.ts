import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe/client";
import { planFromStatus } from "@/lib/stripe/plans";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Webhook da Stripe.
 *
 * Route Handler, e não Server Action, porque a verificação de assinatura exige
 * o corpo **cru**: qualquer parse antes de conferir o header invalidaria o
 * cálculo do HMAC. É também o único lugar, junto do seed, onde a service_role
 * aparece — o webhook não tem sessão de usuário para operar sob RLS.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HANDLED = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    console.error("STRIPE_WEBHOOK_SECRET não configurada");
    return NextResponse.json({ error: "webhook não configurado" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "sem assinatura" }, { status: 400 });

  const raw = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, signature, secret);
  } catch (error) {
    // Assinatura inválida é tentativa de forjar evento: 400 e nada mais.
    console.error("assinatura do webhook inválida", error);
    return NextResponse.json({ error: "assinatura inválida" }, { status: 400 });
  }

  if (!HANDLED.has(event.type)) {
    return NextResponse.json({ received: true, ignored: event.type });
  }

  const admin = createAdminClient();

  // Idempotência: a Stripe reenvia em caso de timeout ou erro. A chave primária
  // da tabela é quem garante que o mesmo evento não rode duas vezes.
  const { error: seen } = await admin
    .from("stripe_events")
    .insert({ id: event.id, type: event.type });

  if (seen) {
    if (seen.code === "23505") return NextResponse.json({ received: true, duplicate: true });
    console.error("falha ao registrar evento", seen);
    return NextResponse.json({ error: "erro interno" }, { status: 500 });
  }

  try {
    await handle(event);
  } catch (error) {
    // Devolver 500 faz a Stripe tentar de novo — mas o evento já está na tabela
    // de idempotência, então precisamos liberá-lo para o reprocessamento.
    await admin.from("stripe_events").delete().eq("id", event.id);
    console.error(`falha ao processar ${event.type}`, error);
    return NextResponse.json({ error: "erro ao processar" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/** Descobre o workspace de uma assinatura, pelos metadados ou pelo customer. */
async function workspaceIdFor(subscription: Stripe.Subscription): Promise<string | null> {
  const fromSubscription = subscription.metadata?.workspace_id;
  if (fromSubscription) return fromSubscription;

  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const customer = await stripe().customers.retrieve(customerId);
  if (!customer.deleted && customer.metadata?.workspace_id) {
    return customer.metadata.workspace_id;
  }

  // Último recurso: a assinatura já pode estar registrada de um evento anterior.
  const { data } = await createAdminClient()
    .from("subscriptions")
    .select("workspace_id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();

  return data?.workspace_id ?? null;
}

/**
 * Extrai o período da assinatura tolerando as duas formas da API da Stripe.
 *
 * O endpoint de webhook é criado com a versão de API padrão da conta, que pode
 * ser mais antiga que a versão fixada no SDK. Até 2024 `current_period_start` e
 * `current_period_end` viviam na assinatura; depois passaram para cada item.
 * Ler só de um dos lugares grava `null` silenciosamente e a tela de cobrança
 * deixa de mostrar a data de renovação.
 */
function period(subscription: Stripe.Subscription, edge: "start" | "end"): string | null {
  const fromItem = subscription.items?.data?.[0]?.[`current_period_${edge}`];
  const legacy = (subscription as unknown as Record<string, number | undefined>)[
    `current_period_${edge}`
  ];

  const seconds = fromItem ?? legacy;
  return seconds ? new Date(seconds * 1000).toISOString() : null;
}

async function syncSubscription(subscription: Stripe.Subscription): Promise<void> {
  const workspaceId = await workspaceIdFor(subscription);
  if (!workspaceId) throw new Error(`assinatura ${subscription.id} sem workspace`);

  const admin = createAdminClient();
  const customerId =
    typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  const { error } = await admin.from("subscriptions").upsert(
    {
      workspace_id: workspaceId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      status: subscription.status,
      current_period_start: period(subscription, "start"),
      current_period_end: period(subscription, "end"),
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "workspace_id" },
  );

  if (error) throw new Error(`upsert da assinatura: ${error.message}`);

  // O plano do workspace é o que o resto da aplicação lê — inclusive os
  // triggers de limite. É ele que precisa ficar em dia.
  const { error: planError } = await admin
    .from("workspaces")
    .update({ plan: planFromStatus(subscription.status) })
    .eq("id", workspaceId);

  if (planError) throw new Error(`atualização do plano: ${planError.message}`);
}

async function handle(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (!session.subscription) return;

      const id =
        typeof session.subscription === "string" ? session.subscription : session.subscription.id;

      // A sessão traz pouco; a assinatura traz status e período.
      const subscription = await stripe().subscriptions.retrieve(id);

      if (!subscription.metadata?.workspace_id && session.metadata?.workspace_id) {
        await stripe().subscriptions.update(id, {
          metadata: { workspace_id: session.metadata.workspace_id },
        });
        subscription.metadata = { workspace_id: session.metadata.workspace_id };
      }

      await syncSubscription(subscription);
      return;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(event.data.object);
      return;
    }
  }
}
