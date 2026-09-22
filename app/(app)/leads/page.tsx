import { Plus, Users } from "lucide-react";
import type { Metadata } from "next";
import { LeadFormDialog } from "@/components/leads/lead-form-dialog";
import { LeadsFilters } from "@/components/leads/leads-filters";
import { LeadsTable } from "@/components/leads/leads-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { listLeads } from "@/lib/mock/leads";
import { listMembers } from "@/lib/mock/workspace";
import { firstString, oneOf } from "@/lib/search-params";
import { LEAD_STATUSES, type LeadFilters, type LeadSortField } from "@/types/domain";

export const metadata: Metadata = { title: "Leads" };

const SORT_FIELDS: LeadSortField[] = ["name", "company", "status", "createdAt"];

type SearchParams = Record<string, string | string[] | undefined>;

/** Traduz a URL no contrato de `listLeads` — e só isso. */
function toFilters(searchParams: SearchParams): LeadFilters {
  const page = Number.parseInt(firstString(searchParams.page) ?? "1", 10);

  return {
    q: firstString(searchParams.q),
    status: oneOf(searchParams.status, LEAD_STATUSES),
    ownerId: firstString(searchParams.owner),
    period: oneOf(searchParams.period, ["7d", "30d", "90d"] as const),
    sort: oneOf(searchParams.sort, SORT_FIELDS) ?? "createdAt",
    dir: oneOf(searchParams.dir, ["asc", "desc"] as const) ?? "desc",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Os mesmos parâmetros, em forma plana, para remontar links no servidor. */
function toPlainParams(searchParams: SearchParams): Record<string, string> {
  return Object.fromEntries(
    Object.entries(searchParams)
      .map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
      .filter(
        (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1] !== "",
      ),
  );
}

export default async function LeadsPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = toFilters(searchParams);
  const [result, members] = await Promise.all([listLeads(filters), listMembers()]);

  const filtered = Boolean(filters.q || filters.status || filters.ownerId || filters.period);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Leads"
        description="Todos os contatos do workspace, com busca e filtros."
        action={
          <LeadFormDialog
            members={members}
            trigger={
              <Button size="sm">
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                Novo lead
              </Button>
            }
          />
        }
      />

      <LeadsFilters members={members} />

      {result.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title={filtered ? "Nenhum lead encontrado" : "Nenhum lead ainda"}
          description={
            filtered
              ? "Ajuste a busca ou limpe os filtros para ver os outros contatos do workspace."
              : "Cadastre o primeiro contato para começar a acompanhar o funil de vendas."
          }
          action={
            filtered ? null : (
              <LeadFormDialog
                members={members}
                trigger={
                  <Button size="sm">
                    <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                    Novo lead
                  </Button>
                }
              />
            )
          }
        />
      ) : (
        <LeadsTable
          result={result}
          members={members}
          sort={filters.sort ?? "createdAt"}
          dir={filters.dir ?? "desc"}
          params={toPlainParams(searchParams)}
        />
      )}
    </div>
  );
}
