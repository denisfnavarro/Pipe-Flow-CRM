import { AlertCircle, Check, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { BillingAction } from "@/components/settings/billing-actions";
import { UsageMeter } from "@/components/settings/usage-meter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireWorkspace } from "@/lib/auth";
import { listMembers } from "@/lib/data/members";
import { countLeads } from "@/lib/data/leads";
import { getSubscription } from "@/lib/data/subscriptions";
import { forbidden } from "@/lib/errors";
import { formatDate, formatMoney } from "@/lib/format";
import { PLANS } from "@/lib/stripe/plans";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Plano e cobrança" };

const STATUS_LABELS: Record<string, string> = {
  active: "Ativa",
  trialing: "Em teste",
  past_due: "Pagamento pendente",
  canceled: "Cancelada",
  unpaid: "Não paga",
  incomplete: "Incompleta",
};

export default async function BillingSettingsPage({
  searchParams,
}: {
  searchParams: { upgrade?: string };
}) {
  const { workspace } = await requireWorkspace();

  // Plano e cobrança são assunto de admin; a policy de `subscriptions` concorda.
  if (workspace.role !== "admin") forbidden("Só administradores veem o plano.");

  const [members, leadCount, subscription] = await Promise.all([
    listMembers(),
    countLeads(),
    getSubscription(),
  ]);

  const plan = PLANS[workspace.plan];
  const isFree = workspace.plan === "free";

  return (
    <div className="space-y-5">
      {searchParams.upgrade === "sucesso" ? (
        <p className="flex items-start gap-2 rounded-md border border-success/30 bg-success/5 px-3 py-2 text-sm">
          <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
          <span>
            Assinatura confirmada. Se o plano ainda aparecer como Free, aguarde alguns segundos — a
            Stripe avisa o PipeFlow por webhook.
          </span>
        </p>
      ) : null}

      {searchParams.upgrade === "cancelado" ? (
        <p className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Checkout cancelado. Nada foi cobrado.
        </p>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            Plano atual
            <span
              className={cn(
                "rounded-sm px-2 py-0.5 text-xs font-medium uppercase",
                isFree ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary",
              )}
            >
              {plan.label}
            </span>
            {subscription && subscription.status !== "active" ? (
              <span className="rounded-sm bg-warning/15 px-2 py-0.5 text-xs font-medium">
                {STATUS_LABELS[subscription.status] ?? subscription.status}
              </span>
            ) : null}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isFree
              ? "Gratuito para sempre, com limites de time e de leads."
              : `${formatMoney(plan.priceCents)} por mês.`}
            {subscription?.currentPeriodEnd
              ? subscription.cancelAtPeriodEnd
                ? ` Cancela em ${formatDate(subscription.currentPeriodEnd)}.`
                : ` Renova em ${formatDate(subscription.currentPeriodEnd)}.`
              : ""}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <UsageMeter label="Colaboradores" used={members.length} limit={plan.seats} />
          <UsageMeter label="Leads" used={leadCount} limit={plan.leads} />

          {subscription ? (
            <div className="flex justify-end pt-1">
              <BillingAction variant="portal" />
            </div>
          ) : null}
        </CardContent>
      </Card>

      {isFree ? (
        <Card className="border-primary/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden />
              PipeFlow Pro
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Tire os limites do time e do cadastro de leads.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-semibold tabular-nums">
                {formatMoney(PLANS.pro.priceCents)}
              </span>
              <span className="text-sm text-muted-foreground">por mês</span>
            </p>

            <ul className="space-y-2">
              {PLANS.pro.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>

            <BillingAction variant="upgrade" className="w-full sm:w-auto" />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
