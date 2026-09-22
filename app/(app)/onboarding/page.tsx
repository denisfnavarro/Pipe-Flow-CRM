import { ArrowRight, Check, KanbanSquare, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { countLeads } from "@/lib/mock/leads";
import { listDeals } from "@/lib/mock/deals";
import { listMembers } from "@/lib/mock/workspace";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Primeiros passos" };

export default async function OnboardingPage() {
  const [leadCount, deals, members] = await Promise.all([countLeads(), listDeals(), listMembers()]);

  const checklist = [
    {
      icon: Users,
      title: "Cadastre o primeiro lead",
      description: "Um contato basta para o funil começar a fazer sentido.",
      href: "/leads",
      cta: "Ir para leads",
      done: leadCount > 0,
    },
    {
      icon: KanbanSquare,
      title: "Crie um negócio no pipeline",
      description: "Vincule o lead a uma oportunidade e defina o valor estimado.",
      href: "/pipeline",
      cta: "Abrir pipeline",
      done: deals.length > 0,
    },
    {
      icon: UserPlus,
      title: "Convide o time",
      description: "Até dois colaboradores no plano gratuito.",
      href: "/settings/members",
      cta: "Convidar",
      done: members.length > 1,
    },
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">Bem-vindo ao PipeFlow</h1>
        <p className="text-sm text-muted-foreground">
          Dê nome ao seu primeiro workspace e siga os três passos abaixo. Leva poucos minutos.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Seu workspace</CardTitle>
          <p className="text-xs text-muted-foreground">
            Use o nome da empresa ou do cliente. Dá para criar outros depois.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="new-workspace">Nome do workspace</Label>
            <Input id="new-workspace" placeholder="Acme Consultoria" />
          </div>
          {/* A criação real entra na M7, junto com a sessão. */}
          <Button size="sm">
            Criar workspace
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
          </Button>
        </CardContent>
      </Card>

      <ol className="space-y-3">
        {checklist.map((step, index) => {
          const Icon = step.icon;
          return (
            <li
              key={step.title}
              className="flex items-start gap-3 rounded-lg border border-border bg-card p-4"
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                  step.done ? "bg-success/15 text-success" : "bg-muted text-muted-foreground",
                )}
                aria-hidden
              >
                {step.done ? <Check className="h-4 w-4" /> : index + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                  {step.title}
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
              </div>

              <Button asChild variant="ghost" size="sm" className="shrink-0">
                <Link href={step.href}>{step.cta}</Link>
              </Button>
            </li>
          );
        })}
      </ol>

      <div className="flex justify-end">
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard">Pular para o dashboard</Link>
        </Button>
      </div>
    </div>
  );
}
