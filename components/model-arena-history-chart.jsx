"use client";

import { useMemo, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate } from "@/lib/model-utils";

function formatCapture(value) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value));
}

export default function ModelArenaHistoryChart({ snapshots, modelName }) {
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
  const [selectedTrack, setSelectedTrack] = useState("");
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
  const latest = points.at(-1);

  if (!tracks.length) {
    return <div className="empty-state compact-empty"><h3>No stored Arena trend yet</h3><p>Track-specific ELO and rank history begins with the first successful scheduled catalog capture.</p></div>;
  }

  return (
    <div className="model-arena-history">
      <div className="arena-history-controls">
        <label className="provider-select"><span className="sr-only">Select Arena history track</span><select value={activeTrack.value} onChange={(event) => setSelectedTrack(event.target.value)}>{tracks.map((track) => <option key={track.value} value={track.value}>{track.arena} · {track.category}</option>)}</select></label>
        <span className="result-count"><strong>{points.length}</strong> stored captures</span>
        {latest ? <span className="result-count">Latest source rank <strong>{latest.rank == null ? "N/A" : `#${latest.rank}`}</strong></span> : null}
      </div>
      {points.length >= 2 ? <div className="history-chart-frame arena-history-chart-frame" role="img" aria-label={`${modelName} ${activeTrack.arena} ${activeTrack.category} Arena ELO and source rank history across ${points.length} snapshots`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points} margin={{ top: 12, right: 18, bottom: 5, left: 4 }}>
            <CartesianGrid stroke="#293238" strokeDasharray="3 5" vertical={false} />
            <XAxis dataKey="captured_at" tickFormatter={formatDate} tick={{ fill: "#858f98", fontSize: 10 }} axisLine={{ stroke: "#343b42" }} tickLine={false} minTickGap={28} />
            <YAxis yAxisId="elo" tick={{ fill: "#b7ff5a", fontSize: 9 }} axisLine={false} tickLine={false} width={48} domain={["auto", "auto"]} />
            <YAxis yAxisId="rank" orientation="right" reversed tick={{ fill: "#53d8ff", fontSize: 9 }} axisLine={false} tickLine={false} width={38} allowDecimals={false} domain={["auto", "auto"]} />
            <Tooltip labelFormatter={formatCapture} formatter={(value, name) => [value == null ? "N/A" : Number(value).toFixed(0), name === "ELO" ? "Source ELO" : "Source rank"]} contentStyle={{ background: "#111519", border: "1px solid #293238", color: "#e8eaed", fontSize: 11 }} />
            <Legend wrapperStyle={{ color: "#8d989f", fontSize: 10 }} />
            <Line yAxisId="elo" type="monotone" dataKey="elo" name="ELO" stroke="#b7ff5a" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} connectNulls={false} />
            <Line yAxisId="rank" type="monotone" dataKey="rank" name="Source rank" stroke="#53d8ff" strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 2 }} activeDot={{ r: 4 }} connectNulls={false} />
          </LineChart>
        </ResponsiveContainer>
      </div> : <div className="empty-state compact-empty"><h3>Not enough history points yet</h3><p>{points.length} stored capture{points.length === 1 ? "" : "s"} for {activeTrack.category}; at least two are needed for a trend line.</p></div>}
      <p className="table-note">ELO uses the left axis; source rank uses the reversed right axis so a higher position means a better rank. Ranks are specific to this Arena track.</p>
    </div>
  );
}
