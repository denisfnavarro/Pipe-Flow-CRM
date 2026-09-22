import type {
  Activity,
  ActivityType,
  Deal,
  DealStage,
  Lead,
  LeadStatus,
  Member,
  Workspace,
} from "@/types/domain";

/**
 * Seed determinístico da camada mock.
 *
 * Um PRNG com semente fixa mantém os dados idênticos entre o render do servidor
 * e o do cliente — sem isso o React acusa hydration mismatch. Datas são
 * calculadas a partir de `NOW` para que prazos vencidos e próximos continuem
 * fazendo sentido em qualquer dia em que o projeto rodar.
 */
function createRandom(seed: number) {
  let state = seed;
  return function next() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const rand = createRandom(20260922);

const pick = <T>(items: readonly T[]): T => items[Math.floor(rand() * items.length)];
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

const NOW = new Date();
NOW.setHours(12, 0, 0, 0);

function daysFromNow(days: number): string {
  const date = new Date(NOW);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export const WORKSPACE: Workspace = {
  id: "ws_pipeflow",
  name: "Acme Consultoria",
  slug: "acme-consultoria",
  plan: "free",
  ownerId: "usr_1",
};

export const WORKSPACES: Workspace[] = [
  WORKSPACE,
  { id: "ws_2", name: "Nimbus Tech", slug: "nimbus-tech", plan: "pro", ownerId: "usr_1" },
  { id: "ws_3", name: "Estúdio Vértice", slug: "estudio-vertice", plan: "free", ownerId: "usr_2" },
];

export const MEMBERS: Member[] = [
  {
    id: "usr_1",
    name: "Denis Navarro",
    email: "denis@14s.com.br",
    role: "admin",
    avatarUrl: null,
    joinedAt: daysFromNow(-240),
  },
  {
    id: "usr_2",
    name: "Camila Ferraz",
    email: "camila@acme.com.br",
    role: "admin",
    avatarUrl: null,
    joinedAt: daysFromNow(-180),
  },
  {
    id: "usr_3",
    name: "Rafael Lima",
    email: "rafael@acme.com.br",
    role: "member",
    avatarUrl: null,
    joinedAt: daysFromNow(-95),
  },
  {
    id: "usr_4",
    name: "Juliana Prado",
    email: "juliana@acme.com.br",
    role: "member",
    avatarUrl: null,
    joinedAt: daysFromNow(-40),
  },
];

/** O usuário "logado" enquanto não existe autenticação real. */
export const CURRENT_USER_ID = "usr_1";

const FIRST_NAMES = [
  "Ana",
  "Bruno",
  "Carla",
  "Diego",
  "Eduarda",
  "Felipe",
  "Gabriela",
  "Henrique",
  "Isabela",
  "João",
  "Larissa",
  "Marcos",
  "Natália",
  "Otávio",
  "Patrícia",
  "Rodrigo",
  "Sofia",
  "Thiago",
  "Vanessa",
  "William",
];

const LAST_NAMES = [
  "Almeida",
  "Barbosa",
  "Cardoso",
  "Duarte",
  "Esteves",
  "Fonseca",
  "Gomes",
  "Henriques",
  "Ibrahim",
  "Ju.nior",
  "Klein",
  "Loureiro",
  "Machado",
  "Nogueira",
  "Oliveira",
  "Pacheco",
  "Queiroz",
  "Ribeiro",
  "Santana",
  "Teixeira",
];

const COMPANIES = [
  "Vetor Logística",
  "Clínica Sorriso",
  "Atlas Contabilidade",
  "Mercado Bom Preço",
  "Fábrica de Software Kuma",
  "Studio Lume",
  "Construtora Ipê",
  "Agro Vale Verde",
  "Rede Farmácia Vida",
  "Transportes Litoral",
  "Escola Horizonte",
  "Boutique Azul",
  "Oficina Motriz",
  "Hotel Brisa Mar",
  "Gráfica Impacto",
  "Café Torrado",
  "Academia Pulso",
  "Imobiliária Terra",
  "Pet Center Lua",
  "Editora Página 7",
];

const TITLES = [
  "Diretor Comercial",
  "Sócio-fundador",
  "Gerente de Marketing",
  "CEO",
  "Coordenadora de Compras",
  "Head de Operações",
  "Analista de TI",
  "Gerente Financeiro",
  "Proprietária",
  "Gestor de Projetos",
];

const LEAD_STATUS_POOL: LeadStatus[] = [
  "new",
  "new",
  "active",
  "active",
  "active",
  "customer",
  "lost",
];

const DEAL_TITLES = [
  "Implantação do CRM",
  "Pacote de consultoria trimestral",
  "Licenças anuais",
  "Migração de sistema legado",
  "Projeto de automação comercial",
  "Renovação de contrato",
  "Treinamento do time de vendas",
  "Integração com ERP",
  "Plano de marketing digital",
  "Reestruturação do funil",
];

const ACTIVITY_TEMPLATES: Record<ActivityType, string[]> = {
  call: [
    "Ligação de qualificação. Confirmou orçamento aprovado para o trimestre.",
    "Retornei a ligação; pediu para falar novamente depois da reunião de diretoria.",
    "Ligação rápida para alinhar o escopo antes da proposta.",
    "Não atendeu. Deixei recado com a secretária.",
  ],
  email: [
    "Enviei a proposta comercial em PDF com as três faixas de preço.",
    "E-mail de follow-up após uma semana sem resposta.",
    "Respondeu pedindo desconto no pagamento anual.",
    "Encaminhei o case de sucesso do cliente do mesmo segmento.",
  ],
  meeting: [
    "Reunião de descoberta: mapeamos o processo comercial atual.",
    "Demonstração do produto para o time de vendas inteiro.",
    "Reunião de fechamento. Faltou apenas o aval do financeiro.",
    "Kick-off do projeto com o time de implantação.",
  ],
  note: [
    "Usa planilha hoje. Principal dor é não enxergar o funil.",
    "Concorrente atual é o Pipedrive; reclama do preço em dólar.",
    "Decisão passa por dois sócios. Ciclo tende a ser longo.",
    "Pediu para retomar o contato no início do próximo trimestre.",
  ],
};

const STAGE_POOL: DealStage[] = [
  "new_lead",
  "new_lead",
  "new_lead",
  "contacted",
  "contacted",
  "contacted",
  "contacted",
  "proposal_sent",
  "proposal_sent",
  "proposal_sent",
  "negotiation",
  "negotiation",
  "negotiation",
  "won",
  "won",
  "won",
  "lost",
  "lost",
];

function slugifyEmail(name: string, company: string): string {
  const user = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z ]/g, "")
    .split(" ")
    .slice(0, 2)
    .join(".");
  const domain = company
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9 ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .join("");
  return `${user}@${domain}.com.br`;
}

function phone(): string {
  return `(${between(11, 85)}) 9${between(1000, 9999)}-${between(1000, 9999)}`;
}

export function buildSeed(): {
  leads: Lead[];
  deals: Deal[];
  activities: Activity[];
} {
  const ownerIds = MEMBERS.map((m) => m.id);
  const leads: Lead[] = [];

  for (let i = 0; i < 30; i++) {
    const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES).replace(".", "")}`;
    const company = COMPANIES[i % COMPANIES.length];
    leads.push({
      id: `lead_${String(i + 1).padStart(2, "0")}`,
      workspaceId: WORKSPACE.id,
      name,
      email: slugifyEmail(name, company),
      phone: phone(),
      company,
      title: pick(TITLES),
      status: pick(LEAD_STATUS_POOL),
      ownerId: pick(ownerIds),
      createdAt: daysFromNow(-between(1, 120)),
    });
  }

  const deals: Deal[] = [];
  const positionByStage = new Map<DealStage, number>();

  for (let i = 0; i < 20; i++) {
    const lead = leads[i];
    const stage = STAGE_POOL[i % STAGE_POOL.length];
    const position = positionByStage.get(stage) ?? 0;
    positionByStage.set(stage, position + 1);

    // Mistura de prazos vencidos, próximos e distantes para exercitar os destaques.
    const dueOffset = i % 5 === 0 ? -between(1, 9) : i % 3 === 0 ? between(0, 4) : between(8, 60);

    deals.push({
      id: `deal_${String(i + 1).padStart(2, "0")}`,
      workspaceId: WORKSPACE.id,
      title: DEAL_TITLES[i % DEAL_TITLES.length],
      value: between(150, 9800) * 100,
      stage,
      leadId: lead.id,
      ownerId: pick(ownerIds),
      dueDate: i % 7 === 0 ? null : daysFromNow(dueOffset),
      position,
      createdAt: daysFromNow(-between(1, 90)),
    });
  }

  const activities: Activity[] = [];
  const types: ActivityType[] = ["call", "email", "meeting", "note"];

  for (let i = 0; i < 60; i++) {
    const lead = leads[i % leads.length];
    const type = types[i % types.length];
    activities.push({
      id: `act_${String(i + 1).padStart(2, "0")}`,
      workspaceId: WORKSPACE.id,
      leadId: lead.id,
      type,
      description: pick(ACTIVITY_TEMPLATES[type]),
      authorId: pick(ownerIds),
      createdAt: daysFromNow(-between(0, 75)),
    });
  }

  return { leads, deals, activities };
}
