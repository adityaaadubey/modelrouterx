"use client";

import { Bar, BarChart, CartesianGrid, Legend, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { benchmarkValue, formatUsd } from "@/lib/model-utils";

const benchmarkAxes = [
  { key: "intelligenceIndex", label: "Intelligence" },
  { key: "codingIndex", label: "Coding" },
  { key: "agenticIndex", label: "Agentic" },
  { key: "multilingualIndex", label: "Multilingual" },
  { key: "opennessIndex", label: "Openness" },
];

export default function CompareCharts({ first, second }) {
  const radarData = benchmarkAxes
    .map((metric) => ({
      subject: metric.label,
      first: benchmarkValue(first, metric.key),
      second: benchmarkValue(second, metric.key),
    }))
    .filter((row) => row.first !== null && row.second !== null);
  const priceData = [
    { label: "Input / 1M", first: first.promptPricePerMillion, second: second.promptPricePerMillion },
    { label: "Output / 1M", first: first.completionPricePerMillion, second: second.completionPricePerMillion },
  ].filter((row) => row.first !== null && row.second !== null);

  return (
    <div className="compare-chart-grid">
      <section className="panel chart-panel">
        <div className="section-heading">
          <div><p className="eyebrow">EXTERNAL INDEX VALUES</p><h2>Benchmark comparison</h2></div>
          <span className="source-inline">Artificial Analysis via OpenRouter</span>
        </div>
        {radarData.length >= 3 ? (
          <div className="comparison-chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="68%">
                <PolarGrid stroke="#293238" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#a0a8af", fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, "auto"]} tick={{ fill: "#68727b", fontSize: 9 }} />
                <Radar name={first.name} dataKey="first" stroke="#b7ff5a" fill="#b7ff5a" fillOpacity={0.16} />
                <Radar name={second.name} dataKey="second" stroke="#53d8ff" fill="#53d8ff" fillOpacity={0.1} />
                <Legend wrapperStyle={{ color: "#a0a8af", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#111519", border: "1px solid #293238", color: "#e8eaed", fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
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
          <div className="comparison-chart-frame">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priceData} margin={{ top: 14, right: 8, bottom: 0, left: 8 }}>
                <CartesianGrid vertical={false} stroke="#293238" strokeDasharray="3 5" />
                <XAxis dataKey="label" tick={{ fill: "#a0a8af", fontSize: 10 }} axisLine={{ stroke: "#343b42" }} tickLine={false} />
                <YAxis tickFormatter={(value) => formatUsd(value)} tick={{ fill: "#858f98", fontSize: 10 }} axisLine={false} tickLine={false} width={62} />
                <Tooltip formatter={(value) => formatUsd(value)} contentStyle={{ background: "#111519", border: "1px solid #293238", color: "#e8eaed", fontSize: 11 }} />
                <Legend wrapperStyle={{ color: "#a0a8af", fontSize: 10 }} />
                <Bar name={first.name} dataKey="first" fill="#b7ff5a" radius={[2, 2, 0, 0]} />
                <Bar name={second.name} dataKey="second" fill="#53d8ff" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="empty-state compact-empty"><h3>Pricing comparison unavailable</h3><p>One or both models do not publish both input and output prices.</p></div>
        )}
      </section>
    </div>
  );
}
