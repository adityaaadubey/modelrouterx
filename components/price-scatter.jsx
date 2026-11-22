"use client";

import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts";
import { formatCount, formatUsd } from "@/lib/model-utils";

export default function PriceScatter({ models }) {
  const chartData = models
    .filter((model) => Number.isFinite(Number(model.contextLength)) && model.contextLength > 0 && Number.isFinite(Number(model.promptPricePerMillion)))
    .slice(0, 90)
    .map((model) => ({
      id: model.id,
      name: model.name,
      contextLength: Number(model.contextLength),
      promptPricePerMillion: Number(model.promptPricePerMillion),
    }));

  return (
    <figure className="chart-figure" aria-label={`Input pricing compared with context length for ${chartData.length} catalog models`}>
      <div className="chart-legend-row">
        <span><i className="legend-dot" /> Catalog models</span>
        <span className="chart-caption">Source values · OpenRouter</span>
      </div>
      {chartData.length ? (
        <div className="chart-frame">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 12, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#252b30" strokeDasharray="3 5" vertical={false} />
              <XAxis
                type="number"
                dataKey="contextLength"
                name="Context"
                tickFormatter={(value) => formatCount(value)}
                tick={{ fill: "#858f98", fontSize: 10, fontFamily: "Geist Mono, monospace" }}
                axisLine={{ stroke: "#343b42" }}
                tickLine={false}
                label={{ value: "CONTEXT WINDOW", position: "insideBottom", offset: -2, fill: "#68727b", fontSize: 9 }}
              />
              <YAxis
                type="number"
                dataKey="promptPricePerMillion"
                name="Input price / 1M"
                tickFormatter={(value) => formatUsd(value)}
                tick={{ fill: "#858f98", fontSize: 10, fontFamily: "Geist Mono, monospace" }}
                axisLine={false}
                tickLine={false}
                width={56}
                label={{ value: "INPUT $ / 1M", angle: -90, position: "insideLeft", fill: "#68727b", fontSize: 9 }}
              />
              <ZAxis range={[38, 38]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3", stroke: "#4c565f" }}
                contentStyle={{ backgroundColor: "#111519", border: "1px solid #293238", borderRadius: 4, color: "#e8eaed", fontSize: 11 }}
                formatter={(value, name) => [name === "Context" ? formatCount(value) : formatUsd(value), name]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name || "Model"}
              />
              <Scatter data={chartData} fill="#b7ff5a" fillOpacity={0.68} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="empty-state compact-empty"><h3>Pricing data unavailable</h3><p>The source has not returned enough numeric values to plot.</p></div>
      )}
      <figcaption className="chart-footnote">Each point is an actual catalog record with a published context window and input price. Lower prices are not a measure of model quality.</figcaption>
    </figure>
  );
}
