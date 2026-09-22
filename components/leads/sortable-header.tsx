import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { buildQuery } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { LeadSortField, SortDirection } from "@/types/domain";

interface SortableHeaderProps {
  field: LeadSortField;
  label: string;
  activeSort: LeadSortField;
  activeDir: SortDirection;
  params: Record<string, string>;
  className?: string;
}

/**
 * Cabeçalho ordenável como link: a ordenação é estado de URL, então funciona
 * sem JavaScript e sobrevive ao reload.
 */
export function SortableHeader({
  field,
  label,
  activeSort,
  activeDir,
  params,
  className,
}: SortableHeaderProps) {
  const active = activeSort === field;
  const nextDir: SortDirection = active && activeDir === "asc" ? "desc" : "asc";
  const Icon = active ? (activeDir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;

  return (
    <Link
      href={`/leads${buildQuery(params, { sort: field, dir: nextDir, page: params.page ?? null })}`}
      aria-sort={active ? (activeDir === "asc" ? "ascending" : "descending") : "none"}
      className={cn(
        "inline-flex items-center gap-1 transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
        className,
      )}
    >
      {label}
      <Icon className="h-3 w-3" aria-hidden />
    </Link>
  );
}
