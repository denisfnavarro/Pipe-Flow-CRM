"use client";

import { Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildQuery } from "@/lib/search-params";
import { LEAD_STATUS_LABELS } from "@/lib/stages";
import { LEAD_STATUSES, type Member } from "@/types/domain";

const PERIODS = [
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "90d", label: "Últimos 90 dias" },
];

const ALL = "__all__";

/**
 * Todo filtro vive na URL: recarregar a página ou compartilhar o link preserva
 * exatamente a mesma visão.
 */
export function LeadsFilters({ members }: { members: Member[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  // A busca é digitada; sem debounce cada tecla viraria uma navegação.
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (query === current) return;

    const timer = setTimeout(() => {
      startTransition(() => {
        router.replace(`${pathname}${buildQuery(searchParams, { q: query })}`, { scroll: false });
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchParams, pathname, router]);

  function setParam(key: string, value: string) {
    router.replace(
      `${pathname}${buildQuery(searchParams, { [key]: value === ALL ? null : value })}`,
      { scroll: false },
    );
  }

  const status = searchParams.get("status") ?? ALL;
  const owner = searchParams.get("owner") ?? ALL;
  const period = searchParams.get("period") ?? ALL;
  const hasFilters = Boolean(
    searchParams.get("q") ||
    searchParams.get("status") ||
    searchParams.get("owner") ||
    searchParams.get("period"),
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative sm:w-64">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por nome, e-mail ou empresa"
          aria-label="Buscar leads"
          className="h-9 pl-8"
        />
      </div>

      <Select value={status} onValueChange={(value) => setParam("status", value)}>
        <SelectTrigger className="h-9 sm:w-40" aria-label="Filtrar por status">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os status</SelectItem>
          {LEAD_STATUSES.map((value) => (
            <SelectItem key={value} value={value}>
              {LEAD_STATUS_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={owner} onValueChange={(value) => setParam("owner", value)}>
        <SelectTrigger className="h-9 sm:w-44" aria-label="Filtrar por responsável">
          <SelectValue placeholder="Responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos os responsáveis</SelectItem>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={period} onValueChange={(value) => setParam("period", value)}>
        <SelectTrigger className="h-9 sm:w-40" aria-label="Filtrar por período">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Qualquer período</SelectItem>
          {PERIODS.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-1.5 text-muted-foreground"
          onClick={() => {
            setQuery("");
            router.replace(pathname, { scroll: false });
          }}
        >
          <X className="h-3.5 w-3.5" aria-hidden />
          Limpar
        </Button>
      ) : null}
    </div>
  );
}
