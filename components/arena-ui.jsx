"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TRACKS, formatArenaCount, formatArenaScore, formatArenaDate, getCategoryLabel, getTrackLabel } from "@/lib/arena-utils";
import useReducedMotion from "@/lib/use-reduced-motion";

export function TrackStrip({ value, onChange, label = "Choose a leaderboard track" }) {
  return (
    <div className="arena-track-strip" role="tablist" aria-label={label}>
      {TRACKS.map((track) => (
        <button
          key={track.config}
          type="button"
          role="tab"
          aria-selected={value === track.config}
          className={value === track.config ? "is-active" : ""}
          onClick={() => onChange(track.config)}
        >
          <span className="arena-track-dot" aria-hidden="true" />
          <span>{track.label}</span>
        </button>
      ))}
    </div>
  );
}

export function CategorySelect({ categories, value, onChange }) {
  if (!categories.length) return null;
  return (
    <label className="arena-category-select">
      <span>SEGMENT</span>
      <select aria-label="Leaderboard segment" value={value} onChange={(event) => onChange(event.target.value)}>
        {categories.map((category) => <option key={category} value={category}>{getCategoryLabel(category)}</option>)}
      </select>
    </label>
  );
}

export function PanelHeading({ eyebrow, title, trailing }) {
  return (
    <div className="arena-panel-heading">
      <div>
        {eyebrow ? <p className="arena-eyebrow">{eyebrow}</p> : null}
        <h2>{title}</h2>
      </div>
      {trailing ? <div className="arena-panel-trailing">{trailing}</div> : null}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="arena-empty-state" role="status">
      <span className="arena-empty-mark" aria-hidden="true">—</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}

function RankingChartTooltip({ active, payload }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;

  return (
    <div className="arena-chart-tooltip chart-tooltip">
      <strong className="chart-tooltip-title">{row.name}</strong>
      <div className="chart-tooltip-row"><span>Source rank</span><strong>#{row.rank}</strong></div>
      <div className="chart-tooltip-row"><span>Published score</span><strong>{formatArenaScore(row.rating)}</strong></div>
    </div>
  );
}

export function RankingChart({ rows, label = "Leaderboard score chart" }) {
  const reducedMotion = useReducedMotion();
  const chartRows = rows.slice(0, 12).map((row) => ({
    name: row.model_name,
    shortName: row.model_name.length > 18 ? `${row.model_name.slice(0, 17)}…` : row.model_name,
    rating: Number(row.rating),
    rank: row.rank,
  })).filter((row) => Number.isFinite(row.rating));

  if (!chartRows.length) {
    return <EmptyState title="Chart will appear after sync">The selected track has no published scores yet.</EmptyState>;
  }

  return (
    <figure className="arena-chart-frame" aria-label={label}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart accessibilityLayer data={chartRows} layout="vertical" margin={{ top: 10, right: 14, bottom: 2, left: 2 }}>
          <CartesianGrid horizontal={false} stroke="var(--arena-grid)" strokeDasharray="3 5" />
          <XAxis type="number" domain={[0, "dataMax"]} tickFormatter={formatArenaScore} tick={{ fill: "var(--arena-muted)", fontSize: 9, fontFamily: "var(--arena-sans)" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="shortName" interval={0} width={122} tick={{ fill: "var(--arena-text-soft)", fontSize: 9, fontFamily: "var(--arena-sans)" }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "var(--chart-hover)" }} content={<RankingChartTooltip />} />
          <Bar dataKey="rating" fill="var(--arena-accent)" radius={0} maxBarSize={18} isAnimationActive={!reducedMotion} animationDuration={520} />
        </BarChart>
      </ResponsiveContainer>
      <figcaption className="sr-only">{label}. Horizontal bars show source-published scores ordered by rank; the scale starts at zero and values are not percentiles.</figcaption>
    </figure>
  );
}

export function RankingTable({ rows, compact = false }) {
  const visibleRows = compact ? rows.slice(0, 10) : rows;
  if (!visibleRows.length) {
    return <EmptyState title="No rankings yet">Once the Render sync service completes its first run, the full ranking appears here.</EmptyState>;
  }

  return (
    <div className="arena-table-wrap">
      <table className="arena-table">
        <caption className="sr-only">Arena model rankings for the selected leaderboard track</caption>
        <thead>
          <tr><th scope="col">RANK</th><th scope="col">MODEL</th><th scope="col">SCORE</th><th scope="col">VOTES / SAMPLES</th><th scope="col">LAB</th></tr>
        </thead>
        <tbody>
          {visibleRows.map((row) => {
            const sampleCount = row.vote_count ?? row.raw?.observation_count ?? row.raw?.session_count;
            return (
              <tr key={row.source_key}>
                <td><span className={`arena-rank-badge ${row.rank <= 3 ? `rank-${row.rank}` : ""}`}>{row.rank}</span></td>
                <td className="arena-model-cell"><strong>{row.model_name}</strong><span>{getTrackLabel(row.source_config)} · {getCategoryLabel(row.category)}</span></td>
                <td className="arena-score-cell">{formatArenaScore(row.rating)}</td>
                <td>{formatArenaCount(sampleCount)}</td>
                <td className="arena-lab-cell">{row.organization || "Not reported"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {compact && rows.length > visibleRows.length ? <p className="arena-table-footnote">Showing the first {visibleRows.length} ranked models.</p> : null}
    </div>
  );
}

export function ModelFlipCard({ model, focusConfig, focusCategory }) {
  const [flipped, setFlipped] = useState(false);
  const selectedRecord = model.trackRecords.find((record) => record.source_config === focusConfig && (!focusCategory || record.category === focusCategory));
  const frontRecord = selectedRecord || model.trackRecords[0];
  const label = flipped ? `Show overview for ${model.modelName}` : `Show all rankings and details for ${model.modelName}`;

  return (
    <button
      type="button"
      className={`arena-model-card ${flipped ? "is-flipped" : ""}`}
      aria-label={label}
      aria-pressed={flipped}
      onClick={() => setFlipped((current) => !current)}
    >
      <span className="arena-model-card-inner">
        <span className="arena-model-card-face arena-model-card-front" aria-hidden={flipped}>
          <span className="arena-card-topline"><span className="arena-model-orbit" aria-hidden="true">{model.organization.slice(0, 1).toUpperCase()}</span><span className="arena-card-track">{frontRecord ? getTrackLabel(frontRecord.source_config) : "MODEL"}</span></span>
          <span className="arena-model-name">{model.modelName}</span>
          <span className="arena-model-organization">{model.organization}</span>
          <span className="arena-card-divider" />
          <span className="arena-card-metric-label">{selectedRecord ? "RANK IN THIS TRACK" : "TRACK APPEARANCES"}</span>
          <span className="arena-card-rank">{selectedRecord ? `#${selectedRecord.rank}` : model.trackRecords.length}</span>
          <span className="arena-card-score">{frontRecord ? `${formatArenaScore(frontRecord.rating)} score` : "Score unavailable"}</span>
          <span className="arena-card-action">Click to rotate · full profile</span>
        </span>
        <span className="arena-model-card-face arena-model-card-back" aria-hidden={!flipped}>
          <span className="arena-card-topline"><span className="arena-card-track">MODEL PROFILE</span><span className="arena-card-track">{model.trackRecords.length} track{model.trackRecords.length === 1 ? "" : "s"}</span></span>
          <span className="arena-model-name">{model.modelName}</span>
          <span className="arena-model-organization">{model.organization} · {model.license}</span>
          <span className="arena-card-divider" />
          <span className="arena-profile-list">
            {model.trackRecords.map((record) => (
              <span className="arena-profile-entry" key={record.source_key}>
                <span className="arena-profile-row"><span>{getTrackLabel(record.source_config)} · {getCategoryLabel(record.category)}</span><strong>#{record.rank} · {formatArenaScore(record.rating)}</strong></span>
                <span className="arena-profile-raw">
                  {Object.entries(record.raw || {}).filter(([, value]) => value !== null && value !== undefined).map(([key, value]) => (
                    <span key={key}><span>{key.replaceAll("_", " ")}</span><strong>{typeof value === "number" ? new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value) : String(value)}</strong></span>
                  ))}
                </span>
              </span>
            ))}
          </span>
          <span className="arena-card-action">Click to return</span>
        </span>
      </span>
    </button>
  );
}

export function SnapshotMeta({ snapshot }) {
  const date = formatArenaDate(snapshot?.published_at || snapshot?.completed_at);
  return <span className="arena-snapshot-meta">{snapshot ? `DATASET UPDATED ${date.toUpperCase()}` : "WAITING FOR FIRST DATASET SYNC"}</span>;
}
