"use client";

import { useState } from "react";
import { ArrowLeftRight, Swords } from "lucide-react";
import { TRACKS, buildModelDirectory, formatArenaCount, formatArenaScore, getDefaultTrack, getTrackLabel } from "@/lib/arena-utils";
import { CategorySelect, EmptyState, SnapshotMeta } from "@/components/arena-ui";

function getRecord(model, config, category) {
  return model?.trackRecords.find((record) => record.source_config === config && record.category === category) || null;
}

function getSamples(record) {
  return record?.vote_count ?? record?.raw?.observation_count ?? record?.raw?.session_count ?? null;
}

export default function ArenaCompareWorkbench({ snapshot, rows = [] }) {
  const defaultTrack = getDefaultTrack(rows);
  const [activeTrack, setActiveTrack] = useState(defaultTrack);
  const [activeCategory, setActiveCategory] = useState("overall");
  const [firstKey, setFirstKey] = useState("");
  const [secondKey, setSecondKey] = useState("");
  const trackRows = rows.filter((row) => row.source_config === activeTrack);
  const categories = [...new Set(trackRows.map((row) => row.category))];
  const selectedCategory = categories.includes(activeCategory) ? activeCategory : categories.includes("overall") ? "overall" : categories[0] || "overall";
  const categoryRows = trackRows.filter((row) => row.category === selectedCategory);
  const models = buildModelDirectory(categoryRows);
  const firstModel = models.find((model) => model.key === firstKey) || models[0] || null;
  const secondModel = models.find((model) => model.key === secondKey) || models.find((model) => model.key !== firstModel?.key) || firstModel;
  const firstRecord = getRecord(firstModel, activeTrack, selectedCategory);
  const secondRecord = getRecord(secondModel, activeTrack, selectedCategory);
  const firstRating = Number(firstRecord?.rating);
  const secondRating = Number(secondRecord?.rating);
  const maxRating = Math.max(firstRating || 0, secondRating || 0, 1);
  const firstWidth = Number.isFinite(firstRating) ? Math.max(6, Math.min(100, (firstRating / maxRating) * 100)) : 0;
  const secondWidth = Number.isFinite(secondRating) ? Math.max(6, Math.min(100, (secondRating / maxRating) * 100)) : 0;
  const intervalsOverlap = firstRecord?.rating_lower != null && firstRecord?.rating_upper != null && secondRecord?.rating_lower != null && secondRecord?.rating_upper != null && Math.max(Number(firstRecord.rating_lower), Number(secondRecord.rating_lower)) <= Math.min(Number(firstRecord.rating_upper), Number(secondRecord.rating_upper));
  const result = !firstRecord || !secondRecord ? "Choose two models to compare." : intervalsOverlap ? "The published confidence ranges overlap; this track does not show a clear lead." : firstRating === secondRating ? "Both models share the same published score in this track." : `${firstRating > secondRating ? firstModel.modelName : secondModel.modelName} leads on this track.`;

  function chooseTrack(config) {
    setActiveTrack(config);
    setActiveCategory("overall");
    setFirstKey("");
    setSecondKey("");
  }

  return (
    <main className="arena-page arena-inner-page">
      <div className="arena-page-kicker"><span>HEAD-TO-HEAD COMPARISON</span><span className="arena-kicker-rule" /><SnapshotMeta snapshot={snapshot} /></div>
      <section className="arena-inner-hero"><div><p className="arena-overline"><Swords aria-hidden="true" /> SAME TRACK. SOURCE SCORES.</p><h1>Let the models face off.</h1><p>Choose two models from one leaderboard. The animated score lanes compare the same published track and show when the confidence ranges overlap.</p></div><div className="arena-directory-count"><strong>{formatArenaCount(models.length)}</strong><span>MODELS IN TRACK</span></div></section>
      {models.length > 1 ? (
        <>
          <section className="arena-compare-controls" aria-label="Choose models and leaderboard">
            <label className="arena-category-select"><span>LEADERBOARD TRACK</span><select value={activeTrack} onChange={(event) => chooseTrack(event.target.value)} aria-label="Leaderboard track">{TRACKS.map((track) => <option key={track.config} value={track.config}>{track.label}</option>)}</select></label>
            <CategorySelect categories={categories} value={selectedCategory} onChange={setActiveCategory} />
            <label className="arena-category-select"><span>MODEL A</span><select aria-label="First model" value={firstModel?.key || ""} onChange={(event) => setFirstKey(event.target.value)}>{models.map((model) => <option key={model.key} value={model.key}>{model.modelName} · {model.organization}</option>)}</select></label>
            <label className="arena-category-select"><span>MODEL B</span><select aria-label="Second model" value={secondModel?.key || ""} onChange={(event) => setSecondKey(event.target.value)}>{models.map((model) => <option key={model.key} value={model.key}>{model.modelName} · {model.organization}</option>)}</select></label>
          </section>
          <section className="arena-duel arena-panel" aria-labelledby="arena-duel-title">
            <div className="arena-duel-header"><div><p className="arena-eyebrow">{getTrackLabel(activeTrack).toUpperCase()} · {selectedCategory.toUpperCase()}</p><h2 id="arena-duel-title">The score showdown</h2></div><span className="arena-duel-label"><ArrowLeftRight aria-hidden="true" /> SAME TRACK</span></div>
            <div className="arena-duel-stage">
              <article className="arena-fighter arena-fighter-a"><span className="arena-fighter-tag">MODEL A</span><strong>{firstModel?.modelName}</strong><small>{firstModel?.organization}</small><div className="arena-duel-meter"><i style={{ "--duel-width": `${firstWidth}%` }} /></div><div className="arena-fighter-meta"><span>RANK #{firstRecord?.rank}</span><strong>{formatArenaScore(firstRecord?.rating)}</strong></div><small>{formatArenaCount(getSamples(firstRecord))} votes / samples</small></article>
              <div className="arena-versus" aria-hidden="true"><span>VS</span></div>
              <article className="arena-fighter arena-fighter-b"><span className="arena-fighter-tag">MODEL B</span><strong>{secondModel?.modelName}</strong><small>{secondModel?.organization}</small><div className="arena-duel-meter"><i style={{ "--duel-width": `${secondWidth}%` }} /></div><div className="arena-fighter-meta"><span>RANK #{secondRecord?.rank}</span><strong>{formatArenaScore(secondRecord?.rating)}</strong></div><small>{formatArenaCount(getSamples(secondRecord))} votes / samples</small></article>
            </div>
            <div className="arena-duel-result" role="status"><span className="arena-duel-result-dot" />{result}</div>
            <p className="arena-panel-note">This is a track-by-track view of published scores, not a new Arena matchup or a claim of overall model quality. Ratings from different tracks are not compared.</p>
          </section>
        </>
      ) : <div className="arena-panel"><EmptyState title="Choose a track with at least two models">The comparison uses only rows that have been published in the same Arena leaderboard.</EmptyState></div>}
    </main>
  );
}
