"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import useSWR from "swr";
import { ArrowUpRight, Search } from "lucide-react";
import { flattenDesignArena, modelSlug } from "@/lib/model-utils";

async function fetchCatalog(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Model catalog refresh failed");
  return response.json();
}

function formatCategory(value) {
  return value.split(/[-_]/g).map((part) => part === "codecategories" ? "Coding" : part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export default function ArenaLeaderboard({ rows }) {
  const { data: liveCatalog, error: refreshError } = useSWR("/api/models?limit=500", fetchCatalog, {
    refreshInterval: 900_000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  });
  const sourceRows = liveCatalog?.models ? flattenDesignArena(liveCatalog.models) : rows;
  const [arenaFilter, setArenaFilter] = useState("all");
  const [trackFilter, setTrackFilter] = useState(() => rows.some((row) => row.arena === "models" && row.category === "website") ? "models/website" : "all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;
  const arenas = useMemo(() => [...new Set(sourceRows.map((row) => row.arena))].sort(), [sourceRows]);
  const tracks = useMemo(() => [...new Set(sourceRows.filter((row) => arenaFilter === "all" || row.arena === arenaFilter).map((row) => `${row.arena}/${row.category}`))].sort(), [sourceRows, arenaFilter]);
  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const sorted = sourceRows
      .filter((row) => arenaFilter === "all" || row.arena === arenaFilter)
      .filter((row) => trackFilter === "all" || `${row.arena}/${row.category}` === trackFilter)
      .filter((row) => !needle || `${row.modelName} ${row.modelId} ${row.category} ${row.arena}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        if (trackFilter === "all" && a.arena !== b.arena) return a.arena.localeCompare(b.arena);
        if (trackFilter === "all" && a.category !== b.category) return a.category.localeCompare(b.category);
        if (a.rank !== null && b.rank !== null && a.rank !== b.rank) return a.rank - b.rank;
        return b.elo - a.elo;
      });
    if (trackFilter !== "all") return sorted;
    const seenByTrack = new Map();
    return sorted.filter((row) => {
      const key = `${row.arena}/${row.category}`;
      const count = seenByTrack.get(key) || 0;
      if (count >= 10) return false;
      seenByTrack.set(key, count + 1);
      return true;
    });
  }, [sourceRows, arenaFilter, trackFilter, query]);
  const totalPages = Math.max(1, Math.ceil(results.length / pageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleRows = results.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  return (
    <div className="table-shell">
      <div className="table-controls arena-controls">
        <label className="provider-select"><span className="sr-only">Filter Arena type</span><select value={arenaFilter} onChange={(event) => { setArenaFilter(event.target.value); setTrackFilter("all"); setPage(0); }}><option value="all">All arenas</option>{arenas.map((arena) => <option key={arena} value={arena}>{arena === "models" ? "Model Design" : formatCategory(arena)}</option>)}</select></label>
        <label className="provider-select"><span className="sr-only">Filter Arena category</span><select value={trackFilter} onChange={(event) => { setTrackFilter(event.target.value); setPage(0); }}><option value="all">All tracks</option>{tracks.map((track) => { const [arena, category] = track.split("/"); return <option key={track} value={track}>{formatCategory(arena)} · {formatCategory(category)}</option>; })}</select></label>
        <label className="table-search"><Search aria-hidden="true" /><span className="sr-only">Search Arena records</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Filter model or category…" /></label>
        <span className="result-count"><strong>{results.length}</strong> ranked records</span>
      </div>
      <div className="table-overflow"><table className="model-table arena-table"><thead><tr><th scope="col">Source rank</th><th scope="col">Model</th><th scope="col">Arena</th><th scope="col">Category</th><th scope="col">Design ELO</th><th scope="col">Win rate</th><th scope="col">Source</th></tr></thead><tbody>
        {visibleRows.map((row, index) => <tr key={`${row.modelId}-${row.arena}-${row.category}-${index}`}><td className="rank-cell">{row.rank === null ? "N/A" : `#${row.rank}`}</td><td className="model-cell"><Link className="model-name-link" href={`/models/${modelSlug(row.modelId)}`}>{row.modelName}</Link><span className="model-id">{row.modelId}</span></td><td><span className="provider-chip">{row.arena}</span></td><td>{formatCategory(row.category)}</td><td className="numeric-cell">{row.elo == null ? <span className="missing-value">N/A</span> : Number(row.elo).toFixed(0)}</td><td className="numeric-cell">{row.winRate === null ? <span className="missing-value">N/A</span> : `${Number(row.winRate).toFixed(1)}%`}</td><td><a className="table-action" href={row.sourceUrl} target="_blank" rel="noreferrer">OpenRouter <ArrowUpRight aria-hidden="true" /></a></td></tr>)}
      </tbody></table>{!results.length ? <div className="empty-state compact-empty"><h3>No Arena records match</h3><p>Choose another track or try a different model search.</p></div> : null}</div>
      {results.length > pageSize ? <nav className="pagination-bar" aria-label="Arena leaderboard pagination"><span>Showing {currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, results.length)} of {results.length}</span><div><button type="button" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={currentPage === 0}>Previous</button><span>PAGE {currentPage + 1} / {totalPages}</span><button type="button" onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={currentPage >= totalPages - 1}>Next</button></div></nav> : null}
      <p className="table-note">{refreshError ? "Periodic source refresh failed; showing the last successful response. " : "Catalog refreshes periodically without a full-page reload. "}Design Arena ELO values and source ranks are surfaced by OpenRouter. Ratings are track-specific; ELO values from different categories are not directly comparable. The unfiltered view shows the top 10 source-ranked entries per track.</p>
    </div>
  );
}
