"use client";

import { useMemo, useState } from "react";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ChartSeriesToggles, ChartTimeRange, getRowsInRange } from "@/components/chart-controls";
import useReducedMotion from "@/lib/use-reduced-motion";
import { formatDate } from "@/lib/model-utils";

const series = [
  { key: "elo", label: "Source ELO", color: "var(--chart-1)" },
  { key: "rank", label: "Source rank", color: "var(--chart-2)" },
];

const chartConfig = {
  elo: { label: "Source ELO", color: "var(--chart-1)" },
  rank: { label: "Source rank", color: "var(--chart-2)" },
};

function formatCapture(value) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export default function ModelArenaHistoryChart({ snapshots, modelName }) {
  const [selectedTrack, setSelectedTrack] = useState("");
  const [range, setRange] = useState("ALL");
  const [activeSeries, setActiveSeries] = useState(series.map((item) => item.key));
  const reducedMotion = useReducedMotion();
  const tracks = useMemo(() => {
    const values = new Map();
    for (const snapshot of snapshots) {
      for (const entry of snapshot.metadata?.designArena || []) {
        if (!entry.arena || !entry.category || entry.elo == null) continue;
        const value = `${entry.arena}/${entry.category}`;
        values.set(value, { value, arena: entry.arena, category: entry.category });
      }
    }
    return [...values.values()].sort((a, b) => a.arena.localeCompare(b.arena) || a.category.localeCompare(b.category));
  }, [snapshots]);
  const activeTrack = tracks.find((track) => track.value === selectedTrack) || tracks[0];
  const points = useMemo(() => {
    if (!activeTrack) return [];
    return snapshots
      .map((snapshot) => ({
        captured_at: snapshot.captured_at,
        ...((snapshot.metadata?.designArena || []).find((entry) => entry.arena === activeTrack.arena && entry.category === activeTrack.category) || {}),
      }))
      .filter((point) => point.elo != null)
      .sort((a, b) => new Date(a.captured_at) - new Date(b.captured_at));
  }, [snapshots, activeTrack]);
  const visiblePoints = useMemo(() => getRowsInRange(points, range), [points, range]);
  const latest = points.at(-1);

  function toggleSeries(key) {
    setActiveSeries((current) => {
      if (current.includes(key) && current.length === 1) return current;
      return current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
    });
  }

  if (!tracks.length) {
    return <div className="empty-state compact-empty"><h3>No stored Arena trend yet</h3><p>Track-specific ELO and rank history begins with the first successful scheduled catalog capture.</p></div>;
  }

  return (
    <div className="model-arena-history">
      <div className="arena-history-controls">
        <label className="provider-select"><span className="sr-only">Select Arena history track</span><select value={activeTrack.value} onChange={(event) => { setSelectedTrack(event.target.value); setRange("ALL"); }}>{tracks.map((track) => <option key={track.value} value={track.value}>{track.arena} · {track.category}</option>)}</select></label>
        <span className="result-count"><strong>{visiblePoints.length}</strong> visible / {points.length} captures</span>
        {latest ? <span className="result-count">Latest source rank <strong>{latest.rank == null ? "N/A" : `#${latest.rank}`}</strong></span> : null}
      </div>
      {points.length >= 2 ? (
        <figure className="history-chart-figure" aria-label={`${modelName} ${activeTrack.arena} ${activeTrack.category} Arena ELO and source rank history`}>
          <div className="chart-toolbar">
            <ChartTimeRange value={range} onChange={setRange} rows={points} />
            <ChartSeriesToggles items={series} activeKeys={activeSeries} onToggle={toggleSeries} label="Show or hide Arena history series" />
          </div>
          <div className="history-chart-frame arena-history-chart-frame">
            <ChartContainer config={chartConfig} className="chart-canvas">
              <LineChart accessibilityLayer data={visiblePoints} margin={{ top: 12, right: 18, bottom: 5, left: 4 }}>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="2 5" vertical={false} />
                <XAxis dataKey="captured_at" tickFormatter={formatDate} tick={{ fill: "var(--text-muted)", fontSize: 10, fontFamily: "var(--mrx-mono)" }} axisLine={{ stroke: "var(--chart-grid)" }} tickLine={false} minTickGap={28} />
                {activeSeries.includes("elo") && <YAxis yAxisId="elo" tick={{ fill: "var(--gold-ink)", fontSize: 9, fontFamily: "var(--mrx-mono)"}} axisLine={false} tickLine={false} width={52} domain={["auto", "auto"]} />}
                {activeSeries.includes("rank") && <YAxis yAxisId="rank" orientation="right" reversed tick={{ fill: "var(--chart-2)", fontSize: 9, fontFamily: "var(--mrx-mono)" }} axisLine={false} tickLine={false} width={42} allowDecimals={false} domain={["auto", "auto"]} />}
                <ChartTooltip cursor={{ stroke: "var(--chart-crosshair)", strokeDasharray: "3 3" }} content={<ChartTooltipContent className="chart-tooltip" labelFormatter={formatCapture} formatter={(value, name) => <div className="chart-tooltip-row"><span>{name}</span><strong>{value == null ? "N/A" : Number(value).toFixed(0)}</strong></div>} />} />
                {activeSeries.includes("elo") && <Line yAxisId="elo" type="monotone" dataKey="elo" name="Source ELO" stroke="var(--color-elo)" strokeWidth={2.25} dot={false} activeDot={{ r: 4, strokeWidth: 2 }} connectNulls={false} isAnimationActive={!reducedMotion} animationDuration={720} animationEasing="ease-out" />}
                {activeSeries.includes("rank") && <Line yAxisId="rank" type="monotone" dataKey="rank" name="Source rank" stroke="var(--color-rank)" strokeWidth={2} strokeDasharray="4 3" dot={false} activeDot={{ r: 4, strokeWidth: 2 }} connectNulls={false} isAnimationActive={!reducedMotion} animationDuration={720} animationEasing="ease-out" />}
              </LineChart>
            </ChartContainer>
          </div>
          <figcaption className="sr-only">Use the range and series buttons to explore historical source ELO and rank values.</figcaption>
        </figure>
      ) : <div className="empty-state compact-empty"><h3>Not enough history points yet</h3><p>{points.length} stored capture{points.length === 1 ? "" : "s"} for {activeTrack.category}; at least two are needed for a trend line.</p></div>}
      <p className="table-note">ELO uses the left axis; source rank uses the reversed right axis so a higher position means a better rank. Ranks are specific to this Arena track.</p>
    </div>
  );
}
