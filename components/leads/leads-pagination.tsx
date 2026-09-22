import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { buildQuery } from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface LeadsPaginationProps {
  page: number;
  pageCount: number;
  total: number;
  perPage: number;
  params: Record<string, string>;
}

export function LeadsPagination({ page, pageCount, total, perPage, params }: LeadsPaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  // Clampa para não gerar `?page=0` nos botões desabilitados das pontas.
  const link = (target: number) =>
    `/leads${buildQuery(params, { page: Math.min(Math.max(target, 1), pageCount) })}`;
  const disabledClass = "pointer-events-none opacity-40 text-muted-foreground cursor-not-allowed";

  return (
    <div className="flex items-center justify-between gap-4 pt-1">
      <p className="text-xs text-muted-foreground">
        Mostrando <span className="font-mono tabular-nums">{from}</span>–
        <span className="font-mono tabular-nums">{to}</span> de{" "}
        <span className="font-mono tabular-nums">{total}</span> leads
      </p>

      <div className="flex items-center gap-1">
        <Link
          href={link(page - 1)}
          aria-label="Página anterior"
          aria-disabled={page <= 1}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted",
            page <= 1 && disabledClass,
          )}
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
        </Link>

        <span className="px-2 text-xs text-muted-foreground">
          <span className="font-mono tabular-nums">{page}</span> de{" "}
          <span className="font-mono tabular-nums">{pageCount}</span>
        </span>

        <Link
          href={link(page + 1)}
          aria-label="Próxima página"
          aria-disabled={page >= pageCount}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted",
            page >= pageCount && disabledClass,
          )}
        >
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
