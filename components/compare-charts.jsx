"use client";

import { useState } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, XAxis, YAxis } from "recharts";
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
  const radarData = benchmarkAxes
    .map((metric) => ({ subject: metric.label, first: benchmarkValue(first, metric.key), second: benchmarkValue(second, metric.key) }))
    .filter((row) => row.first !== null && row.second !== null);
  const priceData = [
    { label: "Input / 1M", first: first.promptPricePerMillion, second: second.promptPricePerMillion },
    { label: "Output / 1M", first: first.completionPricePerMillion, second: second.completionPricePerMillion },
  ].filter((row) => row.first !== null && row.second !== null);
  const series = compareSeries.map((item, index) => ({ ...item, label: index === 0 ? first.name : second.name }));

  return (
    <div className="compare-chart-grid">
      <section className="panel chart-panel">
        <div className="section-heading">
          <div><p className="eyebrow">EXTERNAL INDEX VALUES</p><h2>Benchmark comparison</h2></div>
          <span className="source-inline">Artificial Analysis via OpenRouter</span>
        </div>
        {radarData.length >= 3 ? (
          <>
            <ChartSeriesToggles items={series} activeKeys={activeSeries} onToggle={(key) => setActiveSeries((current) => toggleVisible(current, key))} label="Show or hide model benchmark series" />
            <div className="comparison-chart-frame">
              <ChartContainer config={benchmarkConfig} className="chart-canvas">
                <RadarChart accessibilityLayer data={radarData} outerRadius="68%">
                  <PolarGrid stroke="var(--chart-grid)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-secondary)", fontSize: 10, fontFamily: "var(--mrx-mono)" }} />
                  <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={{ fill: "var(--text-muted)", fontSize: 9, fontFamily: "var(--mrx-mono)" }} axisLine={{ stroke: "var(--chart-grid)" }} />
                  <ChartTooltip content={<ChartTooltipContent className="chart-tooltip" formatter={(value, name) => <div className="chart-tooltip-row"><span>{name}</span><strong>{Number(value).toFixed(1)}</strong></div>} />} />
                  {activeSeries.includes("first") && <Radar name={first.name} dataKey="first" stroke="var(--color-first)" fill="var(--color-first)" fillOpacity={0.14} strokeWidth={2} isAnimationActive={!reducedMotion} animationDuration={720} />}
                  {activeSeries.includes("second") && <Radar name={second.name} dataKey="second" stroke="var(--color-second)" fill="var(--color-second)" fillOpacity={0.12} strokeWidth={2} isAnimationActive={!reducedMotion} animationDuration={720} />}
                </RadarChart>
              </ChartContainer>
            </div>
          </>
        ) : (
          <div className="empty-state compact-empty"><h3>Insufficient shared benchmark data</h3><p>At least three comparable external index values are needed for a radar plot. Missing values are not drawn as zero.</p></div>
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
                  {activeSeries.includes("first") && <Bar name={first.name} dataKey="first" fill="var(--color-first)" isAnimationActive={!reducedMotion} animationDuration={720} />}
                  {activeSeries.includes("second") && <Bar name={second.name} dataKey="second" fill="var(--color-second)" isAnimationActive={!reducedMotion} animationDuration={720} />}
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
