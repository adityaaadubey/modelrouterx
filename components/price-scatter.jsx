"use client";

import { useRouter } from "next/navigation";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from "recharts";
import { formatCount, formatUsd, modelSlug } from "@/lib/model-utils";
import useReducedMotion from "@/lib/use-reduced-motion";

const chartConfig = {
  catalog: { label: "Catalog models", color: "var(--chart-1)" },
  contextLength: { label: "Context window", color: "var(--chart-2)" },
  promptPricePerMillion: { label: "Input price / 1M", color: "var(--chart-3)" },
};

export default function PriceScatter({ models }) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const chartData = models
    .filter((model) => Number.isFinite(Number(model.contextLength)) && model.contextLength > 0 && model.promptPricePerMillion != null && Number.isFinite(Number(model.promptPricePerMillion)))
    .slice(0, 90)
    .map((model) => ({
      id: model.id,
      name: model.name,
      contextLength: Number(model.contextLength),
      promptPricePerMillion: Number(model.promptPricePerMillion),
    }));

  function renderPoint({ cx, cy, payload }) {
    if (cx == null || cy == null) return null;
    const openModel = () => router.push(`/models/${modelSlug(payload.id)}`);
    return (
      <circle
        cx={cx}
        cy={cy}
        r={4}
        className="price-scatter-point"
        fill="var(--color-catalog)"
        fillOpacity={0.78}
        stroke="var(--page)"
        strokeWidth={1.5}
        role="link"
        tabIndex={0}
        aria-label={`Open ${payload.name}; context ${formatCount(payload.contextLength)}; input price ${formatUsd(payload.promptPricePerMillion)} per million tokens`}
        onClick={openModel}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openModel();
          }
        }}
      />
    );
  }

  return (
    <figure className="chart-figure" aria-label={`Input pricing compared with context length for ${chartData.length} catalog models`}>
      <div className="chart-legend-row">
        <span><i className="legend-dot" aria-hidden="true" /> Catalog models · select a point to view its record</span>
        <span className="chart-caption">Source values · OpenRouter</span>
      </div>
      {chartData.length ? (
        <div className="chart-frame">
          <ChartContainer config={chartConfig} className="chart-canvas">
            <ScatterChart accessibilityLayer margin={{ top: 12, right: 12, bottom: 14, left: 2 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 5" vertical={false} />
              <XAxis
                type="number"
                dataKey="contextLength"
                name="Context window"
                tickFormatter={formatCount}
                tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--mrx-mono)" }}
                axisLine={{ stroke: "var(--chart-grid)" }}
                tickLine={false}
                label={{ value: "CONTEXT WINDOW", position: "insideBottom", offset: -2, fill: "var(--text-secondary)", fontSize: 9 }}
              />
              <YAxis
                type="number"
                dataKey="promptPricePerMillion"
                name="Input price / 1M"
                tickFormatter={formatUsd}
                tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--mrx-mono)" }}
                axisLine={false}
                tickLine={false}
                width={62}
                label={{ value: "INPUT PRICE / 1M", angle: -90, position: "insideLeft", fill: "var(--text-secondary)", fontSize: 9 }}
              />
              <ZAxis range={[44, 44]} />
              <ChartTooltip
                cursor={{ strokeDasharray: "3 3", stroke: "var(--chart-crosshair)" }}
                content={<ChartTooltipContent className="chart-tooltip" labelFormatter={(_, payload) => payload?.[0]?.payload?.name || "Model"} formatter={(value, name) => <div className="chart-tooltip-row"><span>{name}</span><strong>{name === "Context window" ? formatCount(value) : formatUsd(value)}</strong></div>} />}
              />
              <Scatter data={chartData} name="Catalog models" fill="var(--color-catalog)" shape={renderPoint} isAnimationActive={!reducedMotion} animationDuration={720} />
            </ScatterChart>
          </ChartContainer>
        </div>
      ) : (
        <div className="empty-state compact-empty"><h3>Pricing data unavailable</h3><p>The source has not returned enough numeric values to plot.</p></div>
      )}
      <figcaption className="chart-footnote">Each point is an actual catalog record with a published context window and input price. Lower prices are not a measure of model quality.</figcaption>
    </figure>
  );
}
