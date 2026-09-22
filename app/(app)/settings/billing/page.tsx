import { Check, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { UsageMeter } from "@/components/settings/usage-meter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoney } from "@/lib/format";
import { countLeads } from "@/lib/mock/leads";
import { getWorkspace, listMembers } from "@/lib/mock/workspace";
import { PLAN_LIMITS } from "@/lib/plans";

export const metadata: Metadata = { title: "Plano e cobrança" };

const PRO_FEATURES = [
  "Colaboradores ilimitados",
  "Leads e negócios ilimitados",
  "Múltiplos workspaces",
  "Relatórios e exportação",
  "Suporte prioritário",
];

export default async function BillingSettingsPage() {
  const [workspace, members, leadCount] = await Promise.all([
    getWorkspace(),
    listMembers(),
    countLeads(),
  ]);

  const limits = PLAN_LIMITS[workspace.plan];
  const isFree = workspace.plan === "free";

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            Plano atual
            <span className="rounded-sm bg-primary/10 px-2 py-0.5 text-xs font-medium uppercase text-primary">
              {limits.label}
            </span>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {isFree
              ? "Gratuito para sempre, com limites de time e de leads."
              : `${formatMoney(limits.priceCents)} por mês, renovação automática.`}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageMeter label="Colaboradores" used={members.length} limit={limits.seats} />
          <UsageMeter label="Leads" used={leadCount} limit={limits.leads} />

          {!isFree ? (
            // O portal do Stripe entra na M11.
            <div className="flex justify-end pt-1">
              <Button size="sm" variant="outline">
                Gerenciar assinatura
              </Button>
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
                {formatMoney(PLAN_LIMITS.pro.priceCents)}
              </span>
              <span className="text-sm text-muted-foreground">por mês</span>
            </p>

            <ul className="space-y-2">
              {PRO_FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>

            {/* O Checkout real entra na M11. */}
            <Button className="w-full sm:w-auto">Fazer upgrade para o Pro</Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
