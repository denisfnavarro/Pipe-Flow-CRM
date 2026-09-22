"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney, formatMoneyCompact } from "@/lib/format";
import { STAGE_LABELS, STAGE_STYLES } from "@/lib/stages";
import type { DashboardMetrics } from "@/types/domain";

interface FunnelChartProps {
  funnel: DashboardMetrics["funnel"];
}

/**
 * Funil em barras horizontais: a leitura de cima para baixo é a própria ordem
 * das etapas, e cada barra carrega a cor da etapa definida nos tokens.
 */
export function FunnelChart({ funnel }: FunnelChartProps) {
  const data = funnel.map((row) => ({
    ...row,
    label: STAGE_LABELS[row.stage],
    color: `hsl(${STAGE_STYLES[row.stage].cssVar})`,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
        <XAxis
          type="number"
          tickFormatter={(value: number) => formatMoneyCompact(value)}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="label"
          width={128}
          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)",
            fontSize: 12,
            color: "hsl(var(--popover-foreground))",
          }}
          formatter={(value, _name, item) => {
            const row = item?.payload as (typeof data)[number] | undefined;
            const cents = typeof value === "number" ? value : Number(value ?? 0);
            return [`${formatMoney(cents)} · ${row?.count ?? 0} negócios`, row?.label ?? ""];
          }}
          labelFormatter={() => ""}
        />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22}>
          {data.map((row) => (
            <Cell key={row.stage} fill={row.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
