import { STAGE_LABELS, STAGE_STYLES } from "@/lib/stages";
import { formatMoney, formatMoneyCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DealStage } from "@/types/domain";

interface PreviewCard {
  title: string;
  company: string;
  cents: number;
  owner: string;
}

const COLUMNS: { stage: DealStage; cards: PreviewCard[] }[] = [
  {
    stage: "contacted",
    cards: [
      { title: "Implantação do CRM", company: "Vetor Logística", cents: 480000, owner: "CF" },
      { title: "Licenças anuais", company: "Atlas Contabilidade", cents: 129000, owner: "RL" },
    ],
  },
  {
    stage: "proposal_sent",
    cards: [
      { title: "Migração de ERP", company: "Construtora Ipê", cents: 960000, owner: "DN" },
      { title: "Consultoria trimestral", company: "Studio Lume", cents: 350000, owner: "JP" },
    ],
  },
  {
    stage: "negotiation",
    cards: [
      { title: "Renovação de contrato", company: "Hotel Brisa Mar", cents: 720000, owner: "CF" },
    ],
  },
];

/**
 * "Screenshot" do produto no hero — renderizado em HTML, não em imagem, para
 * acompanhar o tema claro/escuro e não custar bytes de bitmap no LCP.
 */
export function PipelinePreview() {
  return (
    <div
      className="overflow-hidden rounded-lg border border-border bg-card shadow-sm"
      role="img"
      aria-label="Prévia do pipeline Kanban do PipeFlow, com negócios distribuídos entre as etapas Contato Realizado, Proposta Enviada e Negociação."
    >
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/40 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-stage-lost/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-stage-negotiation/60" />
        <span className="h-2.5 w-2.5 rounded-full bg-stage-won/60" />
        <span className="ml-2 text-xs text-muted-foreground">Pipeline · Acme Consultoria</span>
      </div>

      <div className="grid gap-3 p-3 sm:grid-cols-3">
        {COLUMNS.map(({ stage, cards }) => {
          const total = cards.reduce((sum, card) => sum + card.cents, 0);
          return (
            <div key={stage} className="space-y-2 rounded-md bg-muted/40 p-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-[11px] font-medium",
                    STAGE_STYLES[stage].chip,
                  )}
                >
                  <span className={cn("h-1.5 w-1.5 rounded-full", STAGE_STYLES[stage].bar)} />
                  {STAGE_LABELS[stage]}
                </span>
                <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                  {formatMoneyCompact(total)}
                </span>
              </div>

              {cards.map((card) => (
                <div
                  key={card.title}
                  className="overflow-hidden rounded-md border border-border bg-card"
                >
                  <div className={cn("h-0.5 w-full", STAGE_STYLES[stage].bar)} />
                  <div className="space-y-1 p-2.5">
                    <p className="text-xs font-medium leading-tight">{card.title}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{card.company}</p>
                    <div className="flex items-center justify-between pt-0.5">
                      <span className="font-mono text-[11px] tabular-nums">
                        {formatMoney(card.cents)}
                      </span>
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[9px] font-medium text-muted-foreground">
                        {card.owner}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
