"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate, formatUsd } from "@/lib/model-utils";

export default function ModelHistoryChart({ snapshots }) {
  const rows = [...snapshots].sort((a, b) => new Date(a.captured_at) - new Date(b.captured_at));
  if (rows.length < 2) return <div className="empty-state compact-empty"><h3>Not enough history points yet</h3><p>At least two scheduled captures are needed to draw a line.</p></div>;

  return (
    <div className="history-chart-frame" role="img" aria-label={`Historical input and output prices across ${rows.length} stored snapshots`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 12, right: 14, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#293238" strokeDasharray="3 5" vertical={false} />
          <XAxis dataKey="captured_at" tickFormatter={formatDate} tick={{ fill: "#858f98", fontSize: 10 }} axisLine={{ stroke: "#343b42" }} tickLine={false} minTickGap={28} />
          <YAxis tickFormatter={(value) => formatUsd(value)} tick={{ fill: "#858f98", fontSize: 10 }} axisLine={false} tickLine={false} width={64} />
          <Tooltip labelFormatter={formatDate} formatter={(value, name) => [formatUsd(value), name === "prompt_price_per_million" ? "Input / 1M" : "Output / 1M"]} contentStyle={{ background: "#111519", border: "1px solid #293238", color: "#e8eaed", fontSize: 11 }} />
          <Line type="monotone" dataKey="prompt_price_per_million" name="Input / 1M" stroke="#b7ff5a" strokeWidth={2} dot={false} connectNulls={false} />
          <Line type="monotone" dataKey="completion_price_per_million" name="Output / 1M" stroke="#53d8ff" strokeWidth={2} dot={false} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
