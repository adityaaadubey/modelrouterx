"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowUpRight, CircleDot, Database, Layers3, Users } from "lucide-react";
import { buildModelDirectory, buildProviderDirectory, formatArenaCount, formatArenaDate, formatArenaScore, getDefaultTrack, getModelKey, getTrackLabel } from "@/lib/arena-utils";
import { CategorySelect, EmptyState, ModelFlipCard, PanelHeading, RankingChart, RankingTable, SnapshotMeta, TrackStrip } from "@/components/arena-ui";

export default function ArenaOverview({ snapshot, rows = [], error = null }) {
  const directory = useMemo(() => buildModelDirectory(rows), [rows]);
  const providers = useMemo(() => buildProviderDirectory(rows), [rows]);
  const defaultTrack = getDefaultTrack(rows);
  const [activeTrack, setActiveTrack] = useState(defaultTrack);
  const [activeCategory, setActiveCategory] = useState("overall");
  const trackRows = useMemo(() => rows.filter((row) => row.source_config === activeTrack), [rows, activeTrack]);
  const categories = [...new Set(trackRows.map((row) => row.category))];
  const selectedCategory = categories.includes(activeCategory) ? activeCategory : categories.includes("overall") ? "overall" : categories[0] || "overall";
  const rankingRows = trackRows.filter((row) => row.category === selectedCategory).sort((first, second) => Number(first.rank) - Number(second.rank));
  const topRows = rankingRows.slice(0, 3);
  const modelCount = directory.length;
  const trackCount = new Set(rows.map((row) => row.source_config)).size;
  const providerCount = providers.length;
  const featuredModels = topRows
    .map((row) => directory.find((model) => model.key === getModelKey(row)))
    .filter(Boolean);
  const maxProviderCount = providers[0]?.modelCount || 1;
  const sourceDate = formatArenaDate(snapshot?.published_at || snapshot?.completed_at);

  function chooseTrack(config) {
    setActiveTrack(config);
    setActiveCategory("overall");
  }

  return (
    <main className="arena-page arena-overview-page">
      <div className="arena-page-kicker"><span>INDEPENDENT MODEL RANKINGS</span><span className="arena-kicker-rule" /><SnapshotMeta snapshot={snapshot} /></div>
      <section className="arena-hero-grid" aria-labelledby="arena-home-title">
        <div className="arena-hero-copy">
          <p className="arena-overline"><span className="arena-live-dot" /> HUMAN PREFERENCE, MADE LEGIBLE</p>
          <h1 id="arena-home-title">Measuring AI<br /><em>in the real world.</em></h1>
          <p className="arena-hero-description">Explore how people rank language, vision, agent, and creative models across the Arena&apos;s public leaderboards.</p>
          <div className="arena-hero-meta">
            <span><CircleDot aria-hidden="true" /> {snapshot ? `LATEST RANKINGS · ${sourceDate.toUpperCase()}` : "PUBLIC DATASET · READY TO SYNC"}</span>
            <a href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset" target="_blank" rel="noreferrer">View source <ArrowUpRight aria-hidden="true" /></a>
          </div>
        </div>
        <aside className="arena-latest-panel" aria-label="Top ranked models in the selected leaderboard">
          <div className="arena-latest-heading"><span>TOP RANKED RIGHT NOW</span><span className="arena-latest-mark">{getTrackLabel(activeTrack).toUpperCase()}</span></div>
          {topRows.length ? topRows.map((row) => (
            <div className="arena-latest-row" key={row.source_key}>
              <span className={`arena-latest-rank ${row.rank <= 3 ? `rank-${row.rank}` : ""}`}>{String(row.rank).padStart(2, "0")}</span>
              <span className="arena-latest-model"><strong>{row.model_name}</strong><small>{row.organization || "Organization not reported"}</small></span>
              <span className="arena-latest-score">{formatArenaScore(row.rating)}</span>
            </div>
          )) : (
            <EmptyState title={error ? "Rankings unavailable" : "First sync pending"}>
              {error || "Connect the Render sync service to publish the first leaderboard snapshot."}
            </EmptyState>
          )}
          <p className="arena-latest-footnote">Scores are track-specific. Compare models within the same leaderboard.</p>
        </aside>
      </section>

      <section className="arena-stat-row" aria-label="Leaderboard coverage">
        <article className="arena-stat-card"><span><Database aria-hidden="true" /> MODELS IN THIS SNAPSHOT</span><strong>{formatArenaCount(modelCount)}</strong><small>unique model names</small></article>
        <article className="arena-stat-card"><span><Users aria-hidden="true" /> PROVIDERS / LABS</span><strong>{formatArenaCount(providerCount)}</strong><small>as listed by the source</small></article>
        <article className="arena-stat-card"><span><Layers3 aria-hidden="true" /> LEADERBOARD TRACKS</span><strong>{formatArenaCount(trackCount || 26)}</strong><small>{trackCount ? "available in this snapshot" : "available from the dataset"}</small></article>
      </section>

      <section className="arena-leaderboard-section" aria-labelledby="overview-board-title">
        <div className="arena-section-intro">
          <div><p className="arena-eyebrow">THE ARENA INDEX</p><h2 id="overview-board-title">Every track. One clear view.</h2></div>
          <Link className="arena-text-link" href="/leaderboard">Open full leaderboard <ArrowRight aria-hidden="true" /></Link>
        </div>
        <TrackStrip value={activeTrack} onChange={chooseTrack} />
        <div className="arena-section-toolbar">
          <div><span className="arena-eyebrow">{getTrackLabel(activeTrack).toUpperCase()} RANKINGS</span><strong>{formatArenaCount(rankingRows.length)} ranked entries</strong></div>
          <CategorySelect categories={categories} value={selectedCategory} onChange={setActiveCategory} />
        </div>
        <div className="arena-board-grid">
          <article className="arena-panel arena-chart-panel">
            <PanelHeading eyebrow="SOURCE-PUBLISHED SCORES" title="Top model scores" />
            <RankingChart rows={rankingRows} label={`Top model scores for the ${getTrackLabel(activeTrack)} leaderboard`} />
            <p className="arena-panel-note">The chart uses published ratings from one track only. No cross-track composite is calculated.</p>
          </article>
          <article className="arena-panel arena-ranking-panel">
            <PanelHeading eyebrow="RANKED BY THE ARENA" title="Leaderboard" trailing={<span className="arena-source-chip">{rankingRows.length} MODELS</span>} />
            <RankingTable rows={rankingRows} compact />
          </article>
        </div>
      </section>

      <section className="arena-section" aria-labelledby="arena-models-preview-title">
        <div className="arena-section-intro">
          <div><p className="arena-eyebrow">MODEL DIRECTORY</p><h2 id="arena-models-preview-title">Turn the card for the details.</h2></div>
          <Link className="arena-text-link" href="/models">Explore every model <ArrowRight aria-hidden="true" /></Link>
        </div>
        {featuredModels.length ? (
          <div className="arena-model-card-grid arena-model-card-grid-preview">
            {featuredModels.map((model) => <ModelFlipCard key={model.key} model={model} focusConfig={activeTrack} focusCategory={selectedCategory} />)}
          </div>
        ) : (
          <div className="arena-panel"><EmptyState title="Model cards appear after sync">The public dataset provides the rankings, provider, license, and confidence values shown on each card.</EmptyState></div>
        )}
      </section>

      <section className="arena-provider-preview arena-panel" aria-labelledby="provider-preview-title">
        <div className="arena-section-intro">
          <div><p className="arena-eyebrow">WHO BUILDS WHAT</p><h2 id="provider-preview-title">The labs behind the leaderboard.</h2></div>
          <Link className="arena-text-link" href="/providers">Explore provider map <ArrowRight aria-hidden="true" /></Link>
        </div>
        {providers.length ? (
          <div className="arena-provider-preview-grid">
            <div className="arena-provider-flow-origin"><span className="arena-flow-pulse" /><strong>ARENA DATASET</strong><small>{formatArenaCount(rows.length)} ranked records</small></div>
            <div className="arena-provider-flow-rail" aria-hidden="true"><span /></div>
            <div className="arena-provider-preview-list">
              {providers.slice(0, 6).map((provider, index) => (
                <div className="arena-provider-preview-row" key={provider.key} style={{ "--provider-delay": `${index * 80}ms` }}>
                  <span>{provider.organization}</span><i><b style={{ width: `${Math.max(8, (provider.modelCount / maxProviderCount) * 100)}%` }} /></i><strong>{provider.modelCount}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : <EmptyState title="Provider graph will appear after sync">Organizations are taken from the publisher field in the public Arena dataset.</EmptyState>}
        <p className="arena-panel-note">Counts are unique model names among the top 100 rows fetched for each source track; organization labels are source metadata.</p>
      </section>

      <footer className="arena-endnote"><span><CircleDot aria-hidden="true" /> PUBLIC SOURCE · TRACK-SPECIFIC SCORES</span><span>Independent project · not affiliated with LMArena</span></footer>
    </main>
  );
}
