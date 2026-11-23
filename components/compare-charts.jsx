"use client";

import { useState } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartSeriesToggles } from "@/components/chart-controls";
import useReducedMotion from "@/lib/use-reduced-motion";
import { benchmarkValue, formatUsd } from "@/lib/model-utils";

const benchmarkAxes = [
  { key: "intelligenceIndex", label: "Intelligence" },
  { key: "codingIndex", label: "Coding" },
  { key: "agenticIndex", label: "Agentic" },
  { key: "multilingualIndex", label: "Multilingual" },
  { key: "opennessIndex", label: "Openness" },
];

const compareSeries = [
  { key: "first", label: "Model A", color: "var(--chart-1)" },
  { key: "second", label: "Model B", color: "var(--chart-2)" },
];

const benchmarkConfig = {
  first: { label: "Model A", color: "var(--chart-1)" },
  second: { label: "Model B", color: "var(--chart-2)" },
};

const priceConfig = {
  first: { label: "Model A", color: "var(--chart-1)" },
  second: { label: "Model B", color: "var(--chart-2)" },
};

function toggleVisible(current, key) {
  if (current.includes(key) && current.length === 1) return current;
  return current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
}

export default function CompareCharts({ first, second }) {
  const [activeSeries, setActiveSeries] = useState(compareSeries.map((item) => item.key));
  const reducedMotion = useReducedMotion();
  const benchmarkData = benchmarkAxes
    .map((metric) => {
      const firstValue = benchmarkValue(first, metric.key);
      const secondValue = benchmarkValue(second, metric.key);
      return {
        subject: metric.label,
        first: firstValue,
        second: secondValue,
        winner: firstValue >= secondValue ? "first" : "second",
      };
    })
    .filter((row) => row.first != null && row.second != null && Number.isFinite(Number(row.first)) && Number.isFinite(Number(row.second)));
  const priceData = [
    { label: "Input / 1M", first: first.promptPricePerMillion, second: second.promptPricePerMillion },
    { label: "Output / 1M", first: first.completionPricePerMillion, second: second.completionPricePerMillion },
  ].filter((row) => row.first != null && row.second != null && Number.isFinite(Number(row.first)) && Number.isFinite(Number(row.second)));
  const series = compareSeries.map((item, index) => ({ ...item, label: index === 0 ? first.name : second.name }));

  return (
    <div className="compare-chart-grid">
      <section className="panel chart-panel">
        <div className="section-heading">
          <div><p className="eyebrow">EXTERNAL INDEX VALUES</p><h2>Benchmark comparison</h2></div>
          <span className="source-inline">Artificial Analysis via OpenRouter</span>
        </div>
        {benchmarkData.length ? (
          <>
            <ChartSeriesToggles items={series} activeKeys={activeSeries} onToggle={(key) => setActiveSeries((current) => toggleVisible(current, key))} label="Show or hide model benchmark series" />
            <div className="comparison-chart-frame">
              <ChartContainer config={benchmarkConfig} className="chart-canvas">
                <BarChart accessibilityLayer data={benchmarkData} margin={{ top: 12, right: 10, bottom: 4, left: 2 }} barGap={4} barCategoryGap="24%">
                  <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="2 5" />
                  <XAxis dataKey="subject" interval={0} tickMargin={9} tick={{ fill: "var(--text-secondary)", fontSize: 9, fontFamily: "var(--mrx-mono)" }} axisLine={{ stroke: "var(--chart-grid)" }} tickLine={false} />
                  <YAxis domain={[0, "auto"]} tickFormatter={(value) => Number(value).toFixed(0)} tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--mrx-mono)" }} axisLine={false} tickLine={false} width={42} />
                  <ChartTooltip cursor={{ fill: "var(--chart-hover)" }} content={<ChartTooltipContent className="chart-tooltip" formatter={(value, name) => <div className="chart-tooltip-row"><span>{name}</span><strong>{Number(value).toFixed(1)}</strong></div>} />} />
                  {activeSeries.includes("first") && <Bar name={first.name} dataKey="first" fill="var(--color-first)" radius={0} maxBarSize={28} isAnimationActive={!reducedMotion} animationDuration={520}>
                    {benchmarkData.map((row) => <Cell key={row.subject} fillOpacity={row.winner === "first" ? 1 : 0.58} />)}
                  </Bar>}
                  {activeSeries.includes("second") && <Bar name={second.name} dataKey="second" fill="var(--color-second)" radius={0} maxBarSize={28} isAnimationActive={!reducedMotion} animationDuration={520}>
                    {benchmarkData.map((row) => <Cell key={row.subject} fillOpacity={row.winner === "second" ? 1 : 0.58} />)}
                  </Bar>}
                </BarChart>
              </ChartContainer>
            </div>
          </>
        ) : (
          <div className="empty-state compact-empty"><h3>No shared benchmark data</h3><p>Comparable external index values will appear here when both models have published data. Missing values are not drawn as zero.</p></div>
        )}
      </section>
      <section className="panel chart-panel">
        <div className="section-heading">
          <div><p className="eyebrow">PUBLISHED API PRICES</p><h2>Cost per 1M tokens</h2></div>
          <span className="source-inline">USD · OpenRouter</span>
        </div>
        {priceData.length ? (
          <>
            <ChartSeriesToggles items={series} activeKeys={activeSeries} onToggle={(key) => setActiveSeries((current) => toggleVisible(current, key))} label="Show or hide model price series" />
            <div className="comparison-chart-frame">
              <ChartContainer config={priceConfig} className="chart-canvas">
                <BarChart accessibilityLayer data={priceData} margin={{ top: 14, right: 8, bottom: 0, left: 8 }} barGap={4}>
                  <CartesianGrid vertical={false} stroke="var(--chart-grid)" strokeDasharray="2 5" />
                  <XAxis dataKey="label" tick={{ fill: "var(--text-secondary)", fontSize: 10, fontFamily: "var(--mrx-mono)" }} axisLine={{ stroke: "var(--chart-grid)" }} tickLine={false} />
                  <YAxis tickFormatter={formatUsd} tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--mrx-mono)" }} axisLine={false} tickLine={false} width={62} />
                  <ChartTooltip cursor={{ fill: "var(--chart-hover)" }} content={<ChartTooltipContent className="chart-tooltip" formatter={(value, name) => <div className="chart-tooltip-row"><span>{name}</span><strong>{formatUsd(value)}</strong></div>} />} />
                  {activeSeries.includes("first") && <Bar name={first.name} dataKey="first" fill="var(--color-first)" radius={0} maxBarSize={36} isAnimationActive={!reducedMotion} animationDuration={620} />}
                  {activeSeries.includes("second") && <Bar name={second.name} dataKey="second" fill="var(--color-second)" radius={0} maxBarSize={36} isAnimationActive={!reducedMotion} animationDuration={620} />}
                </BarChart>
              </ChartContainer>
            </div>
          </>
        ) : (
          <div className="empty-state compact-empty"><h3>Pricing comparison unavailable</h3><p>One or both models do not publish both input and output prices.</p></div>
        )}
      </section>
    </div>
  );
}
