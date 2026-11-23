"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Building2, Database } from "lucide-react";
import { buildProviderDirectory, formatArenaCount } from "@/lib/arena-utils";
import { EmptyState, PanelHeading, SnapshotMeta } from "@/components/arena-ui";
import useReducedMotion from "@/lib/use-reduced-motion";

function ProviderChartTooltip({ active, payload }) {
  const provider = payload?.[0]?.payload;
  if (!active || !provider) return null;

  return (
    <div className="arena-chart-tooltip chart-tooltip">
      <strong className="chart-tooltip-title">{provider.organization}</strong>
      <div className="chart-tooltip-row"><span>Unique models</span><strong>{formatArenaCount(provider.modelCount)}</strong></div>
      <div className="chart-tooltip-row"><span>Source tracks</span><strong>{formatArenaCount(provider.trackCount)}</strong></div>
    </div>
  );
}

export default function ArenaProviderExplorer({ snapshot, rows = [] }) {
  const reducedMotion = useReducedMotion();
  const providers = useMemo(() => buildProviderDirectory(rows), [rows]);
  const leadingProviders = providers.slice(0, 10);
  const maxCount = leadingProviders[0]?.modelCount || 1;

  return (
    <main className="arena-page arena-inner-page">
      <div className="arena-page-kicker"><span>PROVIDER LANDSCAPE</span><span className="arena-kicker-rule" /><SnapshotMeta snapshot={snapshot} /></div>
      <section className="arena-inner-hero"><div><p className="arena-overline"><Building2 aria-hidden="true" /> ORGANIZATIONS IN THE DATASET</p><h1>Who builds the models?</h1><p>Follow the leaderboard records from the public Arena dataset to the labs and companies listed in their publisher metadata.</p></div><div className="arena-directory-count"><strong>{formatArenaCount(providers.length)}</strong><span>ORGANIZATIONS</span></div></section>
      {providers.length ? (
        <>
          <section className="arena-panel arena-provider-flow-panel" aria-labelledby="provider-flow-title">
            <PanelHeading eyebrow="MODEL ECOSYSTEM · LIVE SNAPSHOT" title="From Arena to the labs" />
            <div className="arena-provider-flow" aria-label={`Leaderboard dataset connected to ${providers.length} organizations`}>
              <article className="arena-flow-source-node"><span className="arena-flow-node-icon"><Database aria-hidden="true" /></span><span className="arena-flow-node-label">SOURCE</span><strong>Arena dataset</strong><small>{formatArenaCount(rows.length)} ranked records</small></article>
              <div className="arena-flow-connections" aria-hidden="true"><i /><i /><i /><span /></div>
              <div className="arena-flow-targets">
                {leadingProviders.slice(0, 8).map((provider, index) => (
                  <article className="arena-flow-target-node" key={provider.key} style={{ "--node-delay": `${index * 90}ms` }}>
                    <span className="arena-flow-target-dot" aria-hidden="true" /><span className="arena-flow-target-name">{provider.organization}</span><strong>{provider.modelCount}</strong><small>{provider.modelCount === 1 ? "model" : "models"}</small>
                  </article>
                ))}
              </div>
            </div>
            <p className="arena-panel-note">The node animation represents source-to-publisher grouping. Model counts are deduplicated by organization and model name; publisher labels are not independently verified.</p>
          </section>

          <div className="arena-provider-analytics-grid">
            <section className="arena-panel arena-provider-chart-panel">
              <PanelHeading eyebrow="TOP 10 · UNIQUE MODELS" title="Largest represented labs" />
              <figure className="arena-provider-chart" aria-label="Top ten publishers by unique model count">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart accessibilityLayer data={leadingProviders} layout="vertical" margin={{ top: 6, right: 18, bottom: 2, left: 6 }}>
                    <CartesianGrid horizontal={false} stroke="var(--arena-grid)" strokeDasharray="3 5" />
                    <XAxis type="number" domain={[0, maxCount]} tick={{ fill: "var(--arena-muted)", fontSize: 9, fontFamily: "var(--arena-sans)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="organization" width={112} tick={{ fill: "var(--arena-text-soft)", fontSize: 9, fontFamily: "var(--arena-sans)" }} axisLine={false} tickLine={false} />
                    <Tooltip cursor={{ fill: "var(--chart-hover)" }} content={<ProviderChartTooltip />} />
                    <Bar dataKey="modelCount" fill="var(--arena-accent)" radius={0} maxBarSize={18} isAnimationActive={!reducedMotion} animationDuration={520} />
                  </BarChart>
                </ResponsiveContainer>
                <figcaption className="sr-only">Horizontal bars compare the number of unique model names attributed to each publisher in the fetched dataset.</figcaption>
              </figure>
            </section>
            <section className="arena-panel arena-provider-stat-panel"><PanelHeading eyebrow="PUBLISHER COVERAGE" title="At a glance" /><div className="arena-provider-stat"><span><Building2 aria-hidden="true" /> Listed organizations</span><strong>{formatArenaCount(providers.length)}</strong></div><div className="arena-provider-stat"><span><Activity aria-hidden="true" /> Unique model names</span><strong>{formatArenaCount(providers.reduce((total, provider) => total + provider.modelCount, 0))}</strong></div><div className="arena-provider-stat"><span><Database aria-hidden="true" /> Leaderboard tracks</span><strong>{formatArenaCount(new Set(rows.map((row) => row.source_config)).size)}</strong></div><div className="arena-provider-largest"><span>LARGEST PRESENCE</span><strong>{leadingProviders[0]?.organization}</strong><small>{formatArenaCount(leadingProviders[0]?.modelCount)} unique models across the fetched tracks</small></div></section>
          </div>

          <section className="arena-panel arena-provider-table-panel"><PanelHeading eyebrow="ALL PUBLISHERS IN THIS SNAPSHOT" title="Provider directory" trailing={<span className="arena-source-chip">{providers.length} LABS</span>} /><div className="arena-table-wrap"><table className="arena-table"><caption className="sr-only">Unique Arena models by publisher organization</caption><thead><tr><th scope="col">RANK</th><th scope="col">ORGANIZATION</th><th scope="col">MODELS</th><th scope="col">TRACKS</th><th scope="col">TOP LISTED RANK · TRACK-SPECIFIC</th></tr></thead><tbody>{providers.map((provider, index) => <tr key={provider.key}><td><span className={`arena-rank-badge ${index < 3 ? `rank-${index + 1}` : ""}`}>{index + 1}</span></td><td className="arena-model-cell"><strong>{provider.organization}</strong><span>Source-reported publisher</span></td><td className="arena-score-cell">{provider.modelCount}</td><td>{provider.trackCount}</td><td className="arena-lab-cell">{provider.topModel ? `#${provider.topRank} · ${provider.topModel} · ${provider.topConfig}` : "—"}</td></tr>)}</tbody></table></div><p className="arena-panel-note">Counts cover the top 100 rows fetched for each published track. The same model listed in multiple tracks is counted once per organization.</p></section>
        </>
      ) : <div className="arena-panel"><EmptyState title="Provider map will appear after sync">Organization and model counts come directly from the public Arena dataset.</EmptyState></div>}
    </main>
  );
}
