"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { ArrowUpRight, History } from "lucide-react";
import { flattenDesignArena, modelSlug } from "@/lib/model-utils";

async function fetchHistory(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Historical snapshot refresh failed");
  return response.json();
}

function formatCapture(value) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(value));
}

export default function HistoryArenaExplorer({ initialSnapshots }) {
  const { data, error: refreshError } = useSWR("/api/history?source=catalog&limit=1000", fetchHistory, {
    refreshInterval: 900_000,
    revalidateOnFocus: true,
  });
  const snapshots = data?.snapshots || initialSnapshots;
  const captures = useMemo(() => [...new Set(snapshots.map((row) => row.captured_at))].sort((a, b) => new Date(b) - new Date(a)), [snapshots]);
  const [selectedCapture, setSelectedCapture] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const capture = captures.includes(selectedCapture) ? selectedCapture : captures[0] || "";
  const selectedRows = useMemo(() => snapshots.filter((row) => row.captured_at === capture), [snapshots, capture]);
  const modelsAtCapture = selectedRows.map((row) => ({
    id: row.model_id,
    name: row.model_id,
    sourceUrl: `https://openrouter.ai/${row.model_id}`,
    designArena: row.metadata?.designArena || [],
  }));
  const arenaRows = flattenDesignArena(modelsAtCapture);
  const tracks = [...new Set(arenaRows.map((row) => `${row.arena}/${row.category}`))].sort();
  const filtered = arenaRows
    .filter((row) => trackFilter === "all" || `${row.arena}/${row.category}` === trackFilter)
    .sort((a, b) => {
      if (trackFilter === "all" && a.arena !== b.arena) return a.arena.localeCompare(b.arena);
      if (trackFilter === "all" && a.category !== b.category) return a.category.localeCompare(b.category);
      if (a.rank !== null && b.rank !== null && a.rank !== b.rank) return a.rank - b.rank;
      return b.elo - a.elo;
    });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleRows = filtered.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  if (!captures.length) {
    return <section className="panel history-arena-panel"><div className="section-heading"><div><p className="eyebrow"><History aria-hidden="true" /> HISTORICAL LEADERBOARD</p><h2>Design Arena rank snapshots</h2></div><span className="panel-index">AWAITING FIRST CAPTURE</span></div><div className="empty-state compact-empty"><h3>No historical ELO snapshots yet</h3><p>The daily ingestion will begin recording track ranks after CRON_SECRET is configured. No historical values are simulated.</p></div></section>;
  }

  return (
    <section className="panel history-arena-panel">
      <div className="section-heading"><div><p className="eyebrow"><History aria-hidden="true" /> HISTORICAL LEADERBOARD</p><h2>Design Arena rank snapshots</h2></div><span className="panel-index">{captures.length} CAPTURES</span></div>
      <div className="table-controls history-arena-controls">
        <label className="provider-select"><span className="sr-only">Select historical capture</span><select value={capture} onChange={(event) => { setSelectedCapture(event.target.value); setTrackFilter("all"); setPage(0); }}><option value="">Select a capture</option>{captures.map((item) => <option key={item} value={item}>{formatCapture(item)}</option>)}</select></label>
        <label className="provider-select"><span className="sr-only">Filter historical Arena track</span><select value={trackFilter} onChange={(event) => { setTrackFilter(event.target.value); setPage(0); }}><option value="all">All tracks</option>{tracks.map((track) => <option key={track} value={track}>{track.replace("/", " · ")}</option>)}</select></label>
        <span className="result-count"><strong>{filtered.length}</strong> source records</span>
      </div>
      <div className="table-overflow"><table className="model-table arena-table"><thead><tr><th scope="col">Source rank</th><th scope="col">Model</th><th scope="col">Arena</th><th scope="col">Category</th><th scope="col">ELO</th><th scope="col">Win rate</th><th scope="col">Source</th></tr></thead><tbody>{visibleRows.map((row) => <tr key={`${row.modelId}-${row.arena}-${row.category}`}><td className="rank-cell">{row.rank == null ? "N/A" : `#${row.rank}`}</td><td className="model-cell"><Link className="model-name-link" href={`/models/${modelSlug(row.modelId)}`}>{row.modelName}</Link><span className="model-id">{row.modelId}</span></td><td>{row.arena}</td><td>{row.category}</td><td className="numeric-cell">{row.elo == null ? "N/A" : Number(row.elo).toFixed(0)}</td><td className="numeric-cell">{row.winRate == null ? "N/A" : `${Number(row.winRate).toFixed(1)}%`}</td><td><a className="table-action" href={row.sourceUrl} target="_blank" rel="noreferrer">OpenRouter <ArrowUpRight aria-hidden="true" /></a></td></tr>)}</tbody></table></div>
      {filtered.length > pageSize ? <nav className="pagination-bar" aria-label="Historical leaderboard pagination"><span>Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, filtered.length)} of {filtered.length}</span><div><button type="button" onClick={() => setPage((value) => Math.max(0, value - 1))} disabled={currentPage === 0}>Previous</button><span>PAGE {currentPage + 1} / {totalPages}</span><button type="button" onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))} disabled={currentPage >= totalPages - 1}>Next</button></div></nav> : null}
      <p className="table-note">{refreshError ? "Live history refresh failed; showing the last loaded capture. " : "Snapshots revalidate periodically. "}Source rank and ELO values are preserved as captured; scores from different tracks are not compared.</p>
    </section>
  );
}
