import Link from "next/link";
import { ArrowUpRight, Download, TrendingUp } from "lucide-react";
import { getTrendingModels, getHuggingFaceSnapshots } from "@/lib/platform-data";
import { formatCount, formatDate } from "@/lib/model-utils";

export const metadata = { title: "Model popularity trends · ModelRouterX", description: "Explore Hugging Face model downloads and stored snapshots over time, kept separate from quality benchmarks." };

export default async function TrendsPage() {
  const [trending, history] = await Promise.all([getTrendingModels(50), getHuggingFaceSnapshots({ limit: 250 })]);
  const snapshotsByModel = new Map();
  for (const row of history.rows) {
    if (!snapshotsByModel.has(row.model_id)) snapshotsByModel.set(row.model_id, []);
    snapshotsByModel.get(row.model_id).push(row);
  }
  const trends = trending.models.map((model) => {
    const rows = (snapshotsByModel.get(model.id) || []).sort((a, b) => new Date(a.captured_at) - new Date(b.captured_at));
    return { ...model, snapshotCount: rows.length, delta: rows.length > 1 ? Number(rows.at(-1).downloads) - Number(rows[0].downloads) : null };
  });

  return (
    <main className="page-content inner-page">
      <div className="page-kicker"><span>POPULARITY SIGNALS</span><span className="kicker-separator" /><span>NOT QUALITY SCORES</span></div>
      <section className="page-hero-row"><div><p className="eyebrow"><TrendingUp aria-hidden="true" /> HUGGING FACE HUB</p><h1>Popularity trends</h1><p className="page-lede">Browse text-generation models ordered by cumulative Hugging Face downloads. Historical growth appears only after snapshots have been collected.</p></div><span className={`status-pill status-${trending.status}`}><span className="status-dot" />{trending.status.toUpperCase()}</span></section>
      {trending.error ? <div className="source-alert" role="status">{trending.error}</div> : null}
      <section className="panel trend-table-panel">
        <div className="section-heading"><div><p className="eyebrow">RANKED BY CUMULATIVE DOWNLOADS</p><h2>{trending.models.length} source records</h2></div><a className="text-link" href="https://huggingface.co/models?pipeline_tag=text-generation&sort=downloads" target="_blank" rel="noreferrer">Open Hugging Face <ArrowUpRight aria-hidden="true" /></a></div>
        <div className="table-overflow"><table className="model-table trend-table"><thead><tr><th scope="col">Rank</th><th scope="col">Model</th><th scope="col">Task</th><th scope="col">Downloads</th><th scope="col">Likes</th><th scope="col">Snapshots</th><th scope="col">Source</th></tr></thead><tbody>
          {trends.map((model, index) => <tr key={model.id}><td className="rank-cell">{String(index + 1).padStart(2, "0")}</td><td className="model-cell"><a className="model-name-link" href={model.sourceUrl} target="_blank" rel="noreferrer">{model.id}</a><span className="model-id">{model.libraryName || "Hugging Face Hub"}</span></td><td>{model.pipelineTag || "Not reported"}</td><td className="numeric-cell">{formatCount(model.downloads)}</td><td className="numeric-cell">{formatCount(model.likes)}</td><td className="numeric-cell">{model.snapshotCount ? `${model.snapshotCount} · ${model.delta === null ? "baseline" : `${model.delta >= 0 ? "+" : ""}${formatCount(model.delta)}`}` : <span className="missing-value">Collecting</span>}</td><td><a className="table-action" href={model.sourceUrl} target="_blank" rel="noreferrer"><Download aria-hidden="true" /> Source</a></td></tr>)}
        </tbody></table>{!trends.length ? <div className="empty-state compact-empty"><h3>No popularity data</h3><p>The upstream model listing is unavailable.</p></div> : null}</div>
      </section>
      <div className="notice-panel trend-notice"><span className="notice-marker">i</span><p>Cumulative downloads and likes measure activity on Hugging Face, not model performance. Change is computed only between the oldest and newest stored snapshot for the same model; no growth rate is inferred from a single point. {history.rows.length ? `Last stored snapshot: ${formatDate(history.rows[0]?.captured_at)}.` : "Historical tracking begins after the first authenticated scheduled ingestion."}</p></div>
    </main>
  );
}
