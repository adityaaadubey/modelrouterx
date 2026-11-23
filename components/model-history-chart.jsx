"use client";

import { useId, useMemo, useState } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartSeriesToggles, ChartTimeRange, getRowsInRange } from "@/components/chart-controls";
import useReducedMotion from "@/lib/use-reduced-motion";
import { formatDate, formatUsd } from "@/lib/model-utils";

const series = [
  { key: "prompt_price_per_million", label: "Input / 1M", color: "var(--chart-1)" },
  { key: "completion_price_per_million", label: "Output / 1M", color: "var(--chart-2)" },
];

const chartConfig = {
  prompt_price_per_million: { label: "Input / 1M", color: "var(--chart-1)" },
  completion_price_per_million: { label: "Output / 1M", color: "var(--chart-2)" },
};

export default function ModelHistoryChart({ snapshots }) {
  const [range, setRange] = useState("ALL");
  const [activeSeries, setActiveSeries] = useState(series.map((item) => item.key));
  const reducedMotion = useReducedMotion();
  const gradientId = useId().replaceAll(":", "");
  const rows = useMemo(() => [...snapshots].sort((a, b) => new Date(a.captured_at) - new Date(b.captured_at)), [snapshots]);
  const visibleRows = useMemo(() => getRowsInRange(rows, range), [rows, range]);

  function toggleSeries(key) {
    setActiveSeries((current) => {
      if (current.includes(key) && current.length === 1) return current;
      return current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
    });
  }

  if (rows.length < 2) return <div className="empty-state compact-empty"><h3>Not enough history points yet</h3><p>At least two scheduled captures are needed to draw a line.</p></div>;

  return (
    <figure className="history-chart-figure" aria-label={`Historical input and output prices across ${visibleRows.length} of ${rows.length} stored snapshots`}>
      <div className="chart-toolbar">
        <ChartTimeRange value={range} onChange={setRange} rows={rows} />
        <ChartSeriesToggles items={series} activeKeys={activeSeries} onToggle={toggleSeries} label="Show or hide price series" />
      </div>
      <div className="history-chart-frame">
        <ChartContainer config={chartConfig} className="chart-canvas">
          <AreaChart accessibilityLayer data={visibleRows} margin={{ top: 12, right: 16, bottom: 8, left: 2 }}>
            <defs>
              <linearGradient id={`${gradientId}-input`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-prompt_price_per_million)" stopOpacity={0.14} /><stop offset="100%" stopColor="var(--color-prompt_price_per_million)" stopOpacity={0.01} /></linearGradient>
              <linearGradient id={`${gradientId}-output`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--color-completion_price_per_million)" stopOpacity={0.1} /><stop offset="100%" stopColor="var(--color-completion_price_per_million)" stopOpacity={0.01} /></linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 5" vertical={false} />
            <XAxis dataKey="captured_at" tickFormatter={formatDate} tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--mrx-mono)" }} axisLine={{ stroke: "var(--chart-grid)" }} tickLine={false} minTickGap={28} />
            <YAxis tickFormatter={formatUsd} tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--mrx-mono)" }} axisLine={false} tickLine={false} width={64} />
            <ChartTooltip cursor={{ stroke: "var(--chart-crosshair)", strokeDasharray: "3 3" }} content={<ChartTooltipContent className="chart-tooltip" labelFormatter={formatDate} formatter={(value, name) => <div className="chart-tooltip-row"><span>{name}</span><strong>{formatUsd(value)}</strong></div>} />} />
            {activeSeries.includes("prompt_price_per_million") && <Area type="monotone" dataKey="prompt_price_per_million" name="Input / 1M" stroke="var(--color-prompt_price_per_million)" fill={`url(#${gradientId}-input)`} strokeWidth={2.5} activeDot={{ r: 4, strokeWidth: 2 }} dot={false} connectNulls={false} isAnimationActive={!reducedMotion} animationDuration={720} animationEasing="ease-out" />}
            {activeSeries.includes("completion_price_per_million") && <Area type="monotone" dataKey="completion_price_per_million" name="Output / 1M" stroke="var(--color-completion_price_per_million)" fill={`url(#${gradientId}-output)`} strokeWidth={2.5} activeDot={{ r: 4, strokeWidth: 2 }} dot={false} connectNulls={false} isAnimationActive={!reducedMotion} animationDuration={720} animationEasing="ease-out" />}
          </AreaChart>
        </ChartContainer>
      </div>
      <figcaption className="sr-only">Use the range buttons to focus the timeline and the series buttons to show or hide input and output prices.</figcaption>
    </figure>
  );
}
