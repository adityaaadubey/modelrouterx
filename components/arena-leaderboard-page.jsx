"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { formatArenaCount, getDefaultTrack, getTrackLabel } from "@/lib/arena-utils";
import { CategorySelect, EmptyState, PanelHeading, RankingChart, RankingTable, SnapshotMeta, TrackStrip } from "@/components/arena-ui";

export default function ArenaLeaderboardPage({ snapshot, rows = [], error = null }) {
  const [activeTrack, setActiveTrack] = useState(getDefaultTrack(rows));
  const [activeCategory, setActiveCategory] = useState("overall");
  const trackRows = rows.filter((row) => row.source_config === activeTrack);
  const categories = [...new Set(trackRows.map((row) => row.category))];
  const selectedCategory = categories.includes(activeCategory) ? activeCategory : categories.includes("overall") ? "overall" : categories[0] || "overall";
  const rankingRows = trackRows.filter((row) => row.category === selectedCategory).sort((first, second) => Number(first.rank) - Number(second.rank));

  function chooseTrack(config) {
    setActiveTrack(config);
    setActiveCategory("overall");
  }

  return (
    <main className="arena-page arena-inner-page">
      <div className="arena-page-kicker"><span>ALL PUBLISHED LEADERBOARDS</span><span className="arena-kicker-rule" /><SnapshotMeta snapshot={snapshot} /></div>
      <section className="arena-inner-hero">
        <div><p className="arena-overline">SOURCE-PUBLISHED RANKINGS</p><h1>All leaderboards.</h1><p>Browse every published Arena track, from text and vision to agents, search, and media generation.</p></div>
        <a className="arena-upstream-link" href={snapshot?.source_url || "https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset"} target="_blank" rel="noreferrer">Source dataset <ArrowUpRight aria-hidden="true" /></a>
      </section>
      <div className="arena-track-count-line"><span>{formatArenaCount(new Set(rows.map((row) => row.source_config)).size || 26)} TRACKS</span><span>{formatArenaCount(rows.length)} RANKED ROWS</span><span>{snapshot?.published_at || "Awaiting first snapshot"}</span></div>
      <TrackStrip value={activeTrack} onChange={chooseTrack} />
      <section className="arena-board-toolbar">
        <div><p className="arena-eyebrow">CURRENT TRACK</p><h2>{getTrackLabel(activeTrack)}</h2><span>{formatArenaCount(rankingRows.length)} published rows</span></div>
        <CategorySelect categories={categories} value={selectedCategory} onChange={setActiveCategory} />
      </section>
      {error ? <div className="arena-warning" role="status">{error}</div> : null}
      {rankingRows.length ? (
        <div className="arena-board-grid arena-expanded-board">
          <article className="arena-panel arena-chart-panel"><PanelHeading eyebrow="TOP 12 · SOURCE SCORES" title="Ranking graph" /><RankingChart rows={rankingRows} label={`${getTrackLabel(activeTrack)} leaderboard score chart`} /><p className="arena-panel-note">Scores are comparable only within this published track and segment.</p></article>
          <article className="arena-panel arena-ranking-panel"><PanelHeading eyebrow="FULL TRACK" title="Ranked models" trailing={<span className="arena-source-chip">{rankingRows.length} ROWS</span>} /><RankingTable rows={rankingRows} /></article>
        </div>
      ) : (
        <div className="arena-panel"><EmptyState title={error ? "Leaderboard unavailable" : "Waiting for the first Render sync"}>{error || "The 24/7 Render service will write the first public leaderboard snapshot to Supabase."}</EmptyState></div>
      )}
      <div className="arena-bottom-links"><Link className="arena-text-link" href="/models">Browse model cards <ArrowRight aria-hidden="true" /></Link><Link className="arena-text-link" href="/compare">Compare two models <ArrowRight aria-hidden="true" /></Link></div>
    </main>
  );
}
