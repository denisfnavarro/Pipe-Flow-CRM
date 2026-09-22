/**
 * Semeia o banco com os mesmos dados de `lib/mock/seed.ts`.
 *
 * Reusar o gerador do mock garante que a tela construída na Fase 2 e a tela
 * lida do Postgres na Fase 3 mostrem o mesmo conteúdo — a troca de `lib/mock/`
 * por `lib/data/` fica verificável a olho nu.
 *
 * Tudo passa pela API HTTPS com a service_role: nenhuma conexão direta ao
 * Postgres, nenhuma senha de banco envolvida.
 *
 *   npm run seed
 *
 * Desvio consciente em relação ao mock: "Nimbus Tech" passa a ser de um quinto
 * usuário que não participa da Acme. O mock põe os dois workspaces sob o mesmo
 * dono, o que tornaria o teste de isolamento incapaz de provar qualquer coisa.
 */
import { createClient } from "@supabase/supabase-js";
import { buildSeed, MEMBERS, WORKSPACES } from "../lib/mock/seed";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.SEED_PASSWORD;

if (!URL || !SERVICE_KEY || !PASSWORD) {
  throw new Error("Defina NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e SEED_PASSWORD");
}

const admin = createClient(URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_DOMAIN = "pipeflow-demo.com";

/** Usuário de fora, dono do segundo workspace. Existe para o teste de RLS. */
const OUTSIDER = {
  key: "outsider",
  email: `bruno@${DEMO_DOMAIN}`,
  fullName: "Bruno Sales",
};

const DEMO_USERS = [
  ...MEMBERS.map((member) => ({
    key: member.id,
    email: `${member.email.split("@")[0].replace(/[^a-z0-9.]/gi, "")}@${DEMO_DOMAIN}`.toLowerCase(),
    fullName: member.name,
  })),
  OUTSIDER,
];

async function ensureUser(email: string, fullName: string): Promise<string> {
  // A Admin API não tem "buscar por e-mail"; a listagem é o caminho suportado.
  const { data: list, error: listError } = await admin.auth.admin.listUsers({ perPage: 200 });
  if (listError) throw listError;

  const existing = list.users.find((user) => user.email === email);
  if (existing) return existing.id;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw new Error(`createUser(${email}): ${error.message}`);
  return data.user.id;
}

async function main() {
  // -- usuários -------------------------------------------------------------
  const userIdByKey = new Map<string, string>();
  for (const user of DEMO_USERS) {
    userIdByKey.set(user.key, await ensureUser(user.email, user.fullName));
  }
  const resolveUser = (key: string) => userIdByKey.get(key) ?? userIdByKey.get("usr_1")!;

  // -- workspaces -----------------------------------------------------------
  const ownerBySlug: Record<string, string> = {
    "acme-consultoria": "usr_1",
    "nimbus-tech": OUTSIDER.key,
    "estudio-vertice": "usr_2",
  };

  const workspaceIdBySlug = new Map<string, string>();

  for (const workspace of WORKSPACES) {
    const { data: found } = await admin
      .from("workspaces")
      .select("id")
      .eq("slug", workspace.slug)
      .maybeSingle();

    if (found) {
      workspaceIdBySlug.set(workspace.slug, found.id);
      continue;
    }

    const { data, error } = await admin
      .from("workspaces")
      .insert({
        name: workspace.name,
        slug: workspace.slug,
        owner_id: resolveUser(ownerBySlug[workspace.slug] ?? "usr_1"),
        plan: workspace.plan,
      })
      .select("id")
      .single();

    if (error) throw new Error(`workspace ${workspace.slug}: ${error.message}`);
    workspaceIdBySlug.set(workspace.slug, data.id);
  }

  const acmeId = workspaceIdBySlug.get("acme-consultoria")!;

  // O trigger já inseriu o dono como admin; o resto do time entra aqui.
  const { error: membersError } = await admin.from("workspace_members").upsert(
    MEMBERS.map((member) => ({
      workspace_id: acmeId,
      user_id: resolveUser(member.id),
      role: member.role,
    })),
    { onConflict: "workspace_id,user_id" },
  );
  if (membersError) throw new Error(`membros: ${membersError.message}`);

  // -- domínio --------------------------------------------------------------
  // Idempotente: reexecutar o seed reconstrói a Acme em vez de duplicá-la.
  // `activities` e `deals` caem junto por cascade / set null.
  await admin.from("deals").delete().eq("workspace_id", acmeId);
  await admin.from("leads").delete().eq("workspace_id", acmeId);

  const { leads, deals, activities } = buildSeed();

  const { data: insertedLeads, error: leadsError } = await admin
    .from("leads")
    .insert(
      leads.map((lead) => ({
        workspace_id: acmeId,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        title: lead.title,
        status: lead.status,
        owner_id: resolveUser(lead.ownerId),
        created_at: lead.createdAt,
      })),
    )
    .select("id");
  if (leadsError) throw new Error(`leads: ${leadsError.message}`);

  // A ordem de retorno do insert acompanha a ordem enviada.
  const leadIdByMockId = new Map(leads.map((lead, index) => [lead.id, insertedLeads[index].id]));

  const { error: dealsError } = await admin.from("deals").insert(
    deals.map((deal) => ({
      workspace_id: acmeId,
      title: deal.title,
      value: deal.value,
      stage: deal.stage,
      lead_id: deal.leadId ? leadIdByMockId.get(deal.leadId) : null,
      owner_id: resolveUser(deal.ownerId),
      due_date: deal.dueDate,
      position: deal.position,
      created_at: deal.createdAt,
    })),
  );
  if (dealsError) throw new Error(`deals: ${dealsError.message}`);

  const { error: activitiesError } = await admin.from("activities").insert(
    activities.map((activity) => ({
      workspace_id: acmeId,
      lead_id: leadIdByMockId.get(activity.leadId)!,
      type: activity.type,
      description: activity.description,
      author_id: resolveUser(activity.authorId),
      created_at: activity.createdAt,
    })),
  );
  if (activitiesError) throw new Error(`atividades: ${activitiesError.message}`);

  // -- resumo ---------------------------------------------------------------
  const tables = ["workspaces", "workspace_members", "leads", "deals", "activities"] as const;
  console.log("Seed concluído:");
  for (const table of tables) {
    const { count } = await admin.from(table).select("*", { count: "exact", head: true });
    console.log(`  ${table.padEnd(18)} ${count}`);
  }

  console.log("\nUsuários de demonstração (senha em SEED_PASSWORD no .env.local):");
  for (const user of DEMO_USERS) {
    const suffix = user.key === OUTSIDER.key ? "  ← de fora da Acme, para o teste de RLS" : "";
    console.log(`  ${user.email}${suffix}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
