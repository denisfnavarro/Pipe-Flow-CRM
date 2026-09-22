import Link from "next/link";
import { LeadRowActions } from "@/components/leads/lead-row-actions";
import { LeadsPagination } from "@/components/leads/leads-pagination";
import { SortableHeader } from "@/components/leads/sortable-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import type {
  LeadSortField,
  LeadWithRelations,
  Member,
  Paginated,
  SortDirection,
} from "@/types/domain";

interface LeadsTableProps {
  result: Paginated<LeadWithRelations>;
  members: Member[];
  sort: LeadSortField;
  dir: SortDirection;
  params: Record<string, string>;
}

export function LeadsTable({ result, members, sort, dir, params }: LeadsTableProps) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-9">
                <SortableHeader
                  field="name"
                  label="Nome"
                  activeSort={sort}
                  activeDir={dir}
                  params={params}
                />
              </TableHead>
              <TableHead className="h-9">
                <SortableHeader
                  field="company"
                  label="Empresa"
                  activeSort={sort}
                  activeDir={dir}
                  params={params}
                />
              </TableHead>
              <TableHead className="h-9">Cargo</TableHead>
              <TableHead className="h-9">Contato</TableHead>
              <TableHead className="h-9">
                <SortableHeader
                  field="status"
                  label="Status"
                  activeSort={sort}
                  activeDir={dir}
                  params={params}
                />
              </TableHead>
              <TableHead className="h-9">Responsável</TableHead>
              <TableHead className="h-9">
                <SortableHeader
                  field="createdAt"
                  label="Criado em"
                  activeSort={sort}
                  activeDir={dir}
                  params={params}
                />
              </TableHead>
              <TableHead className="h-9 w-10" />
            </TableRow>
          </TableHeader>

          <TableBody>
            {result.items.map((lead) => (
              <TableRow key={lead.id} className="h-10">
                <TableCell className="py-1.5 font-medium">
                  <Link href={`/leads/${lead.id}`} className="hover:text-primary hover:underline">
                    {lead.name}
                  </Link>
                </TableCell>
                <TableCell className="py-1.5 text-muted-foreground">
                  {lead.company ?? "—"}
                </TableCell>
                <TableCell className="py-1.5 text-muted-foreground">{lead.title ?? "—"}</TableCell>
                <TableCell className="py-1.5">
                  <span className="block text-xs">{lead.email ?? "—"}</span>
                  <span className="block font-mono text-xs tabular-nums text-muted-foreground">
                    {lead.phone ?? "—"}
                  </span>
                </TableCell>
                <TableCell className="py-1.5">
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell className="py-1.5">
                  <span className="flex items-center gap-2">
                    <UserAvatar member={lead.owner} />
                    <span className="text-xs text-muted-foreground">{lead.owner.name}</span>
                  </span>
                </TableCell>
                <TableCell className="py-1.5 font-mono text-xs tabular-nums text-muted-foreground">
                  {formatDate(lead.createdAt)}
                </TableCell>
                <TableCell className="py-1.5">
                  <LeadRowActions lead={lead} members={members} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <LeadsPagination
        page={result.page}
        pageCount={result.pageCount}
        total={result.total}
        perPage={result.perPage}
        params={params}
      />
    </div>
  );
}
