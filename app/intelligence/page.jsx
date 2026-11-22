import Link from "next/link";
import { ArrowUpRight, Clock3, Layers3 } from "lucide-react";
import { getCatalog } from "@/lib/platform-data";
import { formatDate, modelSlug } from "@/lib/model-utils";

export const metadata = { title: "Newly indexed models · ModelRouterX", description: "Browse model records by their upstream OpenRouter catalog timestamp." };

export default async function IntelligenceFeedPage() {
  const catalog = await getCatalog();
  const recent = catalog.models
    .filter((model) => model.createdAt)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 50);

  return (
    <main className="page-content inner-page">
      <div className="page-kicker"><span>CATALOG CHANGE SIGNALS</span><span className="kicker-separator" /><span>UPSTREAM TIMESTAMPS</span></div>
      <section className="page-hero-row"><div><p className="eyebrow"><Clock3 aria-hidden="true" /> RECENTLY INDEXED</p><h1>New in the catalog</h1><p className="page-lede">Models ordered by the creation timestamp supplied in the OpenRouter catalog. This is not an independent release date.</p></div><span className="status-pill status-online"><span className="status-dot" />{recent.length} TIMESTAMPED RECORDS</span></section>
      <section className="panel event-feed-panel">
        <div className="section-heading"><div><p className="eyebrow">OPENROUTER CATALOG TIMESTAMP</p><h2>Index events</h2></div><Layers3 className="section-icon" aria-hidden="true" /></div>
        {recent.length ? <ol className="event-feed">{recent.map((model) => <li key={model.id}><time dateTime={model.createdAt}>{formatDate(model.createdAt)}</time><span className="event-node" /><div><Link className="model-name-link" href={`/models/${modelSlug(model.id)}`}>{model.name}</Link><span className="model-id">{model.id}</span></div><span className="event-kind">CATALOG RECORD</span><a href={model.sourceUrl} target="_blank" rel="noreferrer" aria-label={`Open ${model.name} on OpenRouter`}><ArrowUpRight aria-hidden="true" /></a></li>)}</ol> : <div className="empty-state"><h2>No source timestamps available</h2><p>The current catalog does not include a creation timestamp for these model records.</p></div>}
      </section>
    </main>
  );
}
