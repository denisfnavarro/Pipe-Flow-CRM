/**
 * Tipos de domínio do PipeFlow.
 *
 * Esta é a fonte de verdade da camada de dados: `lib/mock/` implementa este
 * contrato hoje e `lib/data/` o implementará contra o Supabase na Fase 3.
 * Nenhum componente de tela deve conhecer outro formato além destes.
 */

export const DEAL_STAGES = [
  "new_lead",
  "contacted",
  "proposal_sent",
  "negotiation",
  "won",
  "lost",
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

/** Etapas que ainda contam como negócio em aberto. */
export const OPEN_STAGES: DealStage[] = ["new_lead", "contacted", "proposal_sent", "negotiation"];

export const ACTIVITY_TYPES = ["call", "email", "meeting", "note"] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const LEAD_STATUSES = ["new", "active", "customer", "lost"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type MemberRole = "admin" | "member";
export type Plan = "free" | "pro";

/**
 * Referência a uma pessoa, o suficiente para renderizar avatar e nome.
 *
 * As listagens trazem isso do `profiles`; papel e data de entrada só existem no
 * contexto de um workspace, então ficam em `Member`.
 */
export interface UserRef {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

export interface Member extends UserRef {
  role: MemberRole;
  joinedAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  ownerId: string;
}

export interface Lead {
  id: string;
  workspaceId: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  title: string | null;
  status: LeadStatus;
  ownerId: string;
  createdAt: string;
}

export interface Deal {
  id: string;
  workspaceId: string;
  title: string;
  /** Sempre em centavos. Formatação para BRL só na view. */
  value: number;
  stage: DealStage;
  leadId: string | null;
  ownerId: string;
  dueDate: string | null;
  position: number;
  createdAt: string;
}

export interface Activity {
  id: string;
  workspaceId: string;
  leadId: string;
  type: ActivityType;
  description: string;
  authorId: string;
  createdAt: string;
}

/** Lead com as relações que a listagem e o Kanban precisam para renderizar. */
export interface LeadWithRelations extends Lead {
  owner: UserRef;
  dealCount: number;
  lastActivityAt: string | null;
}

export interface DealWithRelations extends Deal {
  owner: UserRef;
  lead: Pick<Lead, "id" | "name" | "company"> | null;
}

export interface ActivityWithAuthor extends Activity {
  author: UserRef;
}

export interface LeadDetail extends LeadWithRelations {
  deals: DealWithRelations[];
  activities: ActivityWithAuthor[];
}

// ---------------------------------------------------------------------------
// Filtros e paginação
// ---------------------------------------------------------------------------

export type LeadSortField = "name" | "company" | "status" | "createdAt";
export type SortDirection = "asc" | "desc";

export interface LeadFilters {
  /** Busca textual em nome, e-mail e empresa. */
  q?: string;
  status?: LeadStatus;
  ownerId?: string;
  /** Janela de criação, em dias a partir de hoje. */
  period?: "7d" | "30d" | "90d";
  sort?: LeadSortField;
  dir?: SortDirection;
  page?: number;
  perPage?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  pageCount: number;
}

export interface DashboardMetrics {
  totalLeads: number;
  openDeals: number;
  /** Soma dos negócios em aberto, em centavos. */
  pipelineValue: number;
  /** Fração entre 0 e 1. */
  conversionRate: number;
  funnel: { stage: DealStage; count: number; value: number }[];
}
