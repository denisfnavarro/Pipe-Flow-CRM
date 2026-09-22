import type { ActivityType, DealStage, LeadStatus } from "@/types/domain";

/**
 * Rótulos e cor por etapa. A cor vem sempre de um token — nenhum hex entra em
 * componente, como manda o CLAUDE.md.
 */
export const STAGE_LABELS: Record<DealStage, string> = {
  new_lead: "Novo Lead",
  contacted: "Contato Realizado",
  proposal_sent: "Proposta Enviada",
  negotiation: "Negociação",
  won: "Fechado Ganho",
  lost: "Fechado Perdido",
};

interface StageStyle {
  /** Borda superior do card e barra do gráfico. */
  bar: string;
  /** Chip no cabeçalho da coluna. */
  chip: string;
  /** Cor crua, para o Recharts. */
  cssVar: string;
}

export const STAGE_STYLES: Record<DealStage, StageStyle> = {
  new_lead: {
    bar: "bg-stage-new-lead",
    chip: "bg-stage-new-lead/15 text-foreground",
    cssVar: "var(--stage-new-lead)",
  },
  contacted: {
    bar: "bg-stage-contacted",
    chip: "bg-stage-contacted/15 text-foreground",
    cssVar: "var(--stage-contacted)",
  },
  proposal_sent: {
    bar: "bg-stage-proposal-sent",
    chip: "bg-stage-proposal-sent/15 text-foreground",
    cssVar: "var(--stage-proposal-sent)",
  },
  negotiation: {
    bar: "bg-stage-negotiation",
    chip: "bg-stage-negotiation/15 text-foreground",
    cssVar: "var(--stage-negotiation)",
  },
  won: {
    bar: "bg-stage-won",
    chip: "bg-stage-won/15 text-foreground",
    cssVar: "var(--stage-won)",
  },
  lost: {
    bar: "bg-stage-lost",
    chip: "bg-stage-lost/15 text-foreground",
    cssVar: "var(--stage-lost)",
  },
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Novo",
  active: "Em contato",
  customer: "Cliente",
  lost: "Perdido",
};

export const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-muted text-muted-foreground",
  active: "bg-stage-contacted/15 text-foreground",
  customer: "bg-stage-won/15 text-foreground",
  lost: "bg-stage-lost/15 text-foreground",
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  call: "Ligação",
  email: "E-mail",
  meeting: "Reunião",
  note: "Nota",
};
