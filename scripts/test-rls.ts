/**
 * Teste de isolamento por workspace — o critério de saída da M6.
 *
 * Passa pelo mesmo caminho que o navegador usa: chave publishable + JWT do
 * usuário, sobre PostgREST. Se o RLS estiver frouxo, falha aqui exatamente como
 * falharia em produção. A service_role só é usada para descobrir os ids dos
 * workspaces, nunca para ler dado sob teste.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PASSWORD = process.env.SEED_PASSWORD;

if (!URL || !ANON_KEY || !SERVICE_KEY || !PASSWORD) {
  throw new Error("Variáveis de ambiente ausentes");
}

const DOMAIN = "pipeflow-demo.com";
const INSIDER = `denis@${DOMAIN}`;
const OUTSIDER = `bruno@${DOMAIN}`;

let failures = 0;

function check(description: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  ok    ${description}`);
  } else {
    failures++;
    console.log(`  FALHA ${description}${detail ? ` — ${detail}` : ""}`);
  }
}

/** Cliente autenticado como o usuário, com a chave pública — como o navegador. */
async function signIn(email: string): Promise<SupabaseClient> {
  const client = createClient(URL!, ANON_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error } = await client.auth.signInWithPassword({ email, password: PASSWORD! });
  if (error) throw new Error(`login de ${email}: ${error.message}`);
  return client;
}

async function main() {
  const admin = createClient(URL!, SERVICE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: acme } = await admin
    .from("workspaces")
    .select("id, owner_id")
    .eq("slug", "acme-consultoria")
    .single();
  const { data: nimbus } = await admin
    .from("workspaces")
    .select("id, owner_id")
    .eq("slug", "nimbus-tech")
    .single();

  if (!acme || !nimbus) throw new Error("Seed ausente: rode `npm run seed` antes");
  if (acme.owner_id === nimbus.owner_id) {
    throw new Error("Os dois workspaces têm o mesmo dono; o teste não provaria nada");
  }

  const { count: totalLeads } = await admin
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", acme.id);

  console.log(`Acme tem ${totalLeads} leads no banco.\n`);

  // -- membro de dentro -----------------------------------------------------
  console.log(`Como ${INSIDER} (admin da Acme):`);
  const insider = await signIn(INSIDER);

  const { count: insiderLeads } = await insider
    .from("leads")
    .select("*", { count: "exact", head: true });
  check(
    `enxerga os ${totalLeads} leads da Acme`,
    insiderLeads === totalLeads,
    `viu ${insiderLeads}`,
  );

  const { count: insiderDeals } = await insider
    .from("deals")
    .select("*", { count: "exact", head: true });
  check("enxerga os negócios da Acme", insiderDeals === 20, `viu ${insiderDeals}`);

  // -- usuário de fora ------------------------------------------------------
  console.log(`\nComo ${OUTSIDER} (não é membro da Acme):`);
  const outsider = await signIn(OUTSIDER);

  const { count: outsiderLeads } = await outsider
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", acme.id);
  check("não vê nenhum lead da Acme", outsiderLeads === 0, `viu ${outsiderLeads}`);

  const { count: outsiderDeals } = await outsider
    .from("deals")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", acme.id);
  check("não vê nenhum negócio da Acme", outsiderDeals === 0, `viu ${outsiderDeals}`);

  const { count: outsiderActivities } = await outsider
    .from("activities")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", acme.id);
  check("não vê nenhuma atividade da Acme", outsiderActivities === 0, `viu ${outsiderActivities}`);

  const { count: outsiderWorkspaces } = await outsider
    .from("workspaces")
    .select("*", { count: "exact", head: true })
    .eq("id", acme.id);
  check("não enxerga o próprio workspace da Acme", outsiderWorkspaces === 0);

  const { count: outsiderMembers } = await outsider
    .from("workspace_members")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", acme.id);
  check("não enxerga o time da Acme", outsiderMembers === 0, `viu ${outsiderMembers}`);

  // -- escrita no workspace alheio -----------------------------------------
  const { error: insertError } = await outsider
    .from("leads")
    .insert({ workspace_id: acme.id, name: "Invasor", owner_id: nimbus.owner_id, status: "new" });
  check("é barrado ao inserir lead na Acme", insertError !== null, "o insert passou");

  const { count: updated } = await outsider
    .from("leads")
    .update({ name: "Sequestrado" }, { count: "exact" })
    .eq("workspace_id", acme.id);
  check("não altera nenhum lead da Acme", !updated, `alterou ${updated}`);

  const { count: deleted } = await outsider
    .from("leads")
    .delete({ count: "exact" })
    .eq("workspace_id", acme.id);
  check("não exclui nenhum lead da Acme", !deleted, `excluiu ${deleted}`);

  // -- o de dentro continua intacto ----------------------------------------
  const { count: afterAttack } = await admin
    .from("leads")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", acme.id);
  check(`a Acme segue com ${totalLeads} leads depois das tentativas`, afterAttack === totalLeads);

  console.log(
    failures === 0
      ? "\nIsolamento por workspace: APROVADO"
      : `\nIsolamento por workspace: ${failures} FALHA(S)`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
