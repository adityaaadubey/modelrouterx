import Link from "next/link";
import { ArrowUpRight, Clock3, Database, History as HistoryIcon } from "lucide-react";
import { getHistorySnapshots, getHuggingFaceSnapshots } from "@/lib/platform-data";
import { formatDate, formatUsd } from "@/lib/model-utils";
import HistoryArenaExplorer from "@/components/history-arena-explorer";

export const metadata = { title: "Model data history · ModelRouterX", description: "Inspect persisted model price, context, Arena rank, and Hugging Face popularity snapshots stored in Supabase." };
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [catalogHistory, popularityHistory] = await Promise.all([
    getHistorySnapshots({ limit: 1000 }),
    getHuggingFaceSnapshots({ limit: 100 }),
  ]);
  const configured = catalogHistory.available && popularityHistory.available;
  const rows = catalogHistory.rows;

  return (
    <main className="page-content inner-page">
      <div className="page-kicker"><span>TIME-SERIES RECORDS</span><span className="kicker-separator" /><span>SUPABASE</span></div>
      <section className="page-hero-row"><div><p className="eyebrow"><HistoryIcon aria-hidden="true" /> PERSISTED SNAPSHOTS</p><h1>Model history</h1><p className="page-lede">A record of observed upstream prices, context windows, and model popularity. Historical series start when the first scheduled ingestion completes.</p></div><span className={`status-pill ${configured ? "status-online" : "status-offline"}`}><span className="status-dot" />{configured ? "DATABASE READY" : "DATABASE UNAVAILABLE"}</span></section>
      <section className="metric-grid history-metric-grid">
        <article className="metric-card"><div className="metric-label"><span>MODEL PRICE SNAPSHOTS</span><Database aria-hidden="true" /></div><div className="metric-value">{rows.length}<span className="metric-unit">RECENT</span></div><p>Showing latest persisted records</p></article>
        <article className="metric-card"><div className="metric-label"><span>POPULARITY SNAPSHOTS</span><Clock3 aria-hidden="true" /></div><div className="metric-value">{popularityHistory.rows.length}<span className="metric-unit">RECENT</span></div><p>Hugging Face downloads & likes</p></article>
        <article className="metric-card"><div className="metric-label"><span>LAST MODEL CAPTURE</span><HistoryIcon aria-hidden="true" /></div><div className="metric-value history-date">{formatDate(rows[0]?.captured_at)}</div><p>Recorded in Supabase</p></article>
      </section>
      {catalogHistory.error || popularityHistory.error ? <div className="source-alert" role="status">{catalogHistory.error || popularityHistory.error}</div> : null}
      <HistoryArenaExplorer initialSnapshots={rows} />
      <section className="panel table-panel">
        <div className="section-heading"><div><p className="eyebrow">LATEST CAPTURES</p><h2>Price and context history</h2></div><span className="panel-index">{Math.min(rows.length, 50)} RECENT ROWS</span></div>
        {rows.length ? <div className="table-overflow"><table className="model-table"><thead><tr><th scope="col">Captured at</th><th scope="col">Model ID</th><th scope="col">Input / 1M</th><th scope="col">Output / 1M</th><th scope="col">Context</th></tr></thead><tbody>{rows.slice(0, 50).map((row) => <tr key={`${row.model_id}-${row.captured_at}`}><td>{formatDate(row.captured_at)}</td><td><Link className="model-name-link" href={`/models/${row.model_id.replaceAll("/", "~")}`}>{row.model_id}</Link></td><td className="numeric-cell">{row.prompt_price_per_million === null ? "N/A" : formatUsd(row.prompt_price_per_million)}</td><td className="numeric-cell">{row.completion_price_per_million === null ? "N/A" : formatUsd(row.completion_price_per_million)}</td><td className="numeric-cell">{row.context_length ? row.context_length.toLocaleString("en-US") : "N/A"}</td></tr>)}</tbody></table></div> : <div className="empty-state"><span className="empty-symbol">∅</span><h2>No stored catalog history yet</h2><p>Live model data is available in the catalog. Historical rows start after the first authenticated Vercel Cron ingestion.</p><Link className="panel-link" href="/models">Open live catalog <ArrowUpRight aria-hidden="true" /></Link></div>}
      </section>
      <p className="page-footnote">Vercel Cron is configured to run once daily. A project-level CRON_SECRET is required to authorize the scheduled ingestion endpoint.</p>
    </main>
  );
}
