import { ArrowRight, Check, KanbanSquare, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { CreateWorkspaceForm } from "@/components/auth/create-workspace-form";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { listMyWorkspaces, requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Primeiros passos" };

/**
 * Fica fora do grupo `(app)` de propósito: `requireWorkspace` redireciona para
 * cá quem ainda não tem workspace, e o layout autenticado chamaria esse mesmo
 * helper — o que fecharia um laço de redirecionamento.
 */
export default async function OnboardingPage() {
  const user = await requireSession();
  const workspaces = await listMyWorkspaces();
  const first = workspaces[0];

  const supabase = createClient();
  const [{ count: leadCount }, { count: dealCount }, { count: memberCount }] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("deals").select("*", { count: "exact", head: true }),
    supabase.from("workspace_members").select("*", { count: "exact", head: true }),
  ]);

  const checklist = [
    {
      icon: Users,
      title: "Cadastre o primeiro lead",
      description: "Um contato basta para o funil começar a fazer sentido.",
      href: "/leads",
      cta: "Ir para leads",
      done: (leadCount ?? 0) > 0,
    },
    {
      icon: KanbanSquare,
      title: "Crie um negócio no pipeline",
      description: "Vincule o lead a uma oportunidade e defina o valor estimado.",
      href: "/pipeline",
      cta: "Abrir pipeline",
      done: (dealCount ?? 0) > 0,
    },
    {
      icon: UserPlus,
      title: "Convide o time",
      description: "Até dois colaboradores no plano gratuito.",
      href: "/settings/members",
      cta: "Convidar",
      done: (memberCount ?? 0) > 1,
    },
  ];

  const firstName = ((user.user_metadata?.full_name as string | undefined) ?? "").split(" ")[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <Logo />

      <div className="space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">
          {firstName ? `Bem-vindo, ${firstName}` : "Bem-vindo ao PipeFlow"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {first
            ? "Seu workspace já existe. Siga os três passos abaixo para tirar o CRM do zero."
            : "Dê nome ao seu primeiro workspace. Leva menos de um minuto."}
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">
            {first ? "Criar outro workspace" : "Seu workspace"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateWorkspaceForm />
        </CardContent>
      </Card>

      {first ? (
        <>
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
              <Link href="/dashboard">
                Ir para o dashboard
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden />
              </Link>
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
