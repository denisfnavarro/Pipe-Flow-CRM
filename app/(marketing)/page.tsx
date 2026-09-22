import {
  ArrowRight,
  BarChart3,
  Building2,
  Check,
  KanbanSquare,
  MessagesSquare,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PipelinePreview } from "@/components/marketing/pipeline-preview";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "PipeFlow CRM — o funil de vendas da sua empresa, visível de ponta a ponta",
  description:
    "CRM simples e visual para PMEs, freelancers e times de vendas. Pipeline Kanban, gestão de leads e histórico de atividades. Comece de graça.",
  openGraph: {
    title: "PipeFlow CRM",
    description:
      "Pipeline Kanban, gestão de leads e histórico de atividades em um CRM que cabe na sua rotina. Plano gratuito para sempre.",
    url: "/",
    siteName: "PipeFlow CRM",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PipeFlow CRM",
    description: "O funil de vendas da sua empresa, visível de ponta a ponta.",
  },
  alternates: { canonical: "/" },
};

const FEATURES = [
  {
    icon: KanbanSquare,
    title: "Pipeline Kanban",
    description:
      "Seis etapas, do primeiro contato ao fechamento. Arraste o card e o funil inteiro se atualiza — sem planilha, sem retrabalho.",
  },
  {
    icon: Users,
    title: "Gestão de leads",
    description:
      "Nome, empresa, cargo, telefone e responsável em um cadastro só. Busca e filtros para achar qualquer contato em segundos.",
  },
  {
    icon: MessagesSquare,
    title: "Histórico de atividades",
    description:
      "Ligações, e-mails, reuniões e notas em uma timeline por lead. Quem assumir a conversa amanhã sabe exatamente onde ela parou.",
  },
  {
    icon: BarChart3,
    title: "Dashboard de vendas",
    description:
      "Leads, negócios abertos, valor do pipeline e taxa de conversão. Mais o gráfico de funil, para ver onde as oportunidades travam.",
  },
  {
    icon: Building2,
    title: "Multi-empresa",
    description:
      "Um workspace por empresa ou cliente, com dados isolados no banco. Troque de contexto pelo seletor da barra lateral.",
  },
  {
    icon: Check,
    title: "Time com permissões",
    description:
      "Convide colaboradores por e-mail. Admin cuida do plano e do time; membro trabalha os leads e os negócios.",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "R$ 0",
    period: "para sempre",
    description: "Para quem está começando a organizar o processo comercial.",
    features: [
      "Até 2 colaboradores",
      "Até 50 leads",
      "Pipeline Kanban completo",
      "Timeline de atividades",
      "Dashboard de métricas",
    ],
    cta: "Começar de graça",
    href: "/signup",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 49",
    period: "por mês",
    description: "Para times que já vivem dentro do CRM todos os dias.",
    features: [
      "Colaboradores ilimitados",
      "Leads e negócios ilimitados",
      "Múltiplos workspaces",
      "Relatórios e exportação",
      "Suporte prioritário",
    ],
    cta: "Assinar o Pro",
    href: "/signup?plan=pro",
    highlighted: true,
  },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-14 lg:py-20">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
              Plano gratuito, sem cartão de crédito
            </span>

            <h1 className="text-balance text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              O funil de vendas da sua empresa, visível de ponta a ponta.
            </h1>

            <p className="max-w-xl text-base leading-relaxed text-muted-foreground">
              O PipeFlow reúne leads, negócios e histórico de conversas em um CRM que o seu time
              entende no primeiro dia. A simplicidade do Pipedrive, sem a complexidade — e com um
              plano gratuito de verdade.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/signup">
                  Criar conta grátis
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#funcionalidades">Ver funcionalidades</Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Configure o workspace em menos de cinco minutos. Cancele quando quiser.
            </p>
          </div>

          <PipelinePreview />
        </div>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Tudo o que um time de vendas usa. Nada do que ele não usa.
            </h2>
            <p className="text-muted-foreground">
              Cada tela existe para responder a uma pergunta do dia a dia comercial: onde está o
              negócio, o que já foi conversado e quanto ainda há para fechar.
            </p>
          </div>

          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li
                  key={feature.title}
                  className="rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40"
                >
                  <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-md bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" aria-hidden />
                  </span>
                  <h3 className="text-sm font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Planos */}
      <section id="planos" className="scroll-mt-16 border-b border-border">
        <div className="mx-auto w-full max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Um preço só, sem surpresa no câmbio
            </h2>
            <p className="text-muted-foreground">
              Comece no Free e faça upgrade quando o time crescer. Sem contrato anual, sem taxa de
              implantação.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "relative flex flex-col rounded-lg border bg-card p-6",
                  plan.highlighted ? "border-primary shadow-sm" : "border-border",
                )}
              >
                {plan.highlighted ? (
                  <span className="absolute -top-2.5 left-6 rounded-sm bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground">
                    Mais escolhido
                  </span>
                ) : null}

                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {plan.name}
                </h3>

                <p className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl font-semibold tabular-nums">
                    {plan.price}
                  </span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </p>

                <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  asChild
                  className="mt-6 w-full"
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section>
        <div className="mx-auto w-full max-w-4xl px-4 py-16 text-center sm:px-6 lg:py-20">
          <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            Pare de perder negócio dentro de uma planilha.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Crie o seu workspace, importe os primeiros leads e veja o funil inteiro na primeira
            tela. Leva menos tempo do que a reunião de segunda-feira.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link href="/signup">
              Criar conta grátis
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
