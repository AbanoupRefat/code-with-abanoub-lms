"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export interface PieSlice {
  name: string;
  value: number;
  color: string;
}

interface PaymentPieProps {
  title: string;
  subtitle?: string;
  data: PieSlice[];
  /** Formats values in the legend, tooltip and centre label */
  format?: (n: number) => string;
  /** Text under the centre total, e.g. "Total" */
  centerCaption?: string;
  emptyText?: string;
}

export default function PaymentPie({
  title,
  subtitle,
  data,
  format = (n) => String(n),
  centerCaption = "Total",
  emptyText = "No data for this period",
}: PaymentPieProps) {
  const slices = data.filter((d) => d.value > 0);
  const total = slices.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="clean-panel rounded-xl p-5 shadow-sm">
      <h3 className="font-bold text-foreground text-sm">{title}</h3>
      {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}

      {slices.length === 0 ? (
        <div className="h-52 mt-4 flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/20">
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <>
          <div className="relative h-52 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="90%"
                  paddingAngle={slices.length > 1 ? 2 : 0}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {slices.map((s) => (
                    <Cell key={s.name} fill={s.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [format(Number(value)), String(name)]}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-bold text-foreground leading-tight">{format(total)}</span>
              <span className="text-[11px] text-muted-foreground">{centerCaption}</span>
            </div>
          </div>

          <ul className="mt-3 space-y-1.5">
            {slices.map((s) => (
              <li key={s.name} className="flex items-center justify-between gap-3 text-xs">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-foreground truncate">{s.name}</span>
                </span>
                <span className="text-muted-foreground whitespace-nowrap">
                  <span className="font-semibold text-foreground">{format(s.value)}</span>
                  {" · "}
                  {Math.round((s.value / total) * 100)}%
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
