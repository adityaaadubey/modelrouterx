"use client";

import { useMemo, useState } from "react";
import { Boxes, Search } from "lucide-react";
import { TRACKS, buildModelDirectory, formatArenaCount } from "@/lib/arena-utils";
import { EmptyState, ModelFlipCard, SnapshotMeta } from "@/components/arena-ui";

const PAGE_SIZE = 24;

export default function ArenaModelExplorer({ snapshot, rows = [] }) {
  const models = useMemo(() => buildModelDirectory(rows), [rows]);
  const [query, setQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("all");
  const [page, setPage] = useState(0);
  const filteredModels = models.filter((model) => {
    const matchesQuery = `${model.modelName} ${model.organization} ${model.license}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesTrack = selectedTrack === "all" || model.trackRecords.some((record) => record.source_config === selectedTrack);
    return matchesQuery && matchesTrack;
  });
  const pageCount = Math.max(1, Math.ceil(filteredModels.length / PAGE_SIZE));
  const pageModels = filteredModels.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <main className="arena-page arena-inner-page">
      <div className="arena-page-kicker"><span>MODEL DIRECTORY</span><span className="arena-kicker-rule" /><SnapshotMeta snapshot={snapshot} /></div>
      <section className="arena-inner-hero"><div><p className="arena-overline"><Boxes aria-hidden="true" /> TAP A CARD TO TURN IT OVER</p><h1>Models, in full.</h1><p>Every model in the current Arena snapshot, with its organization, license, rank, score, and track appearances on the reverse.</p></div><div className="arena-directory-count"><strong>{formatArenaCount(models.length)}</strong><span>UNIQUE MODELS</span></div></section>
      <section className="arena-directory-controls" aria-label="Filter models">
        <label className="arena-search-field"><Search aria-hidden="true" /><span className="sr-only">Search models and organizations</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder="Search models or labs" /></label>
        <label className="arena-category-select"><span>TRACK</span><select aria-label="Filter models by track" value={selectedTrack} onChange={(event) => { setSelectedTrack(event.target.value); setPage(0); }}><option value="all">All tracks</option>{TRACKS.map((track) => <option key={track.config} value={track.config}>{track.label}</option>)}</select></label>
        <span className="arena-result-count">{formatArenaCount(filteredModels.length)} models</span>
      </section>
      {pageModels.length ? (
        <section className="arena-model-card-grid" aria-label="Model cards">
          {pageModels.map((model) => <ModelFlipCard key={model.key} model={model} focusConfig={selectedTrack === "all" ? undefined : selectedTrack} />)}
        </section>
      ) : (
        <div className="arena-panel"><EmptyState title={rows.length ? "No matching models" : "The model deck is empty"}>{rows.length ? "Try a different name, organization, or leaderboard track." : "Models appear after the Render sync service writes the first snapshot."}</EmptyState></div>
      )}
      {filteredModels.length ? <nav className="arena-pagination" aria-label="Model card pages"><button type="button" disabled={page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</button><span>PAGE {page + 1} / {pageCount}</span><button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}>Next</button></nav> : null}
      <p className="arena-panel-note">Each source track is refreshed from the public dataset and capped at its top 100 rows per sync. Track scores are not combined.</p>
    </main>
  );
}
