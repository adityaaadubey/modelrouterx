import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Braces, ChartNoAxesCombined, ExternalLink, Layers3 } from "lucide-react";
import { getCatalog, getHistorySnapshots } from "@/lib/platform-data";
import { benchmarkValue, formatCount, formatDate, formatTokens, formatUsd, modelIdFromSlug } from "@/lib/model-utils";
import ModelHistoryChart from "@/components/model-history-chart";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: `${modelIdFromSlug(slug)} · ModelRouterX`, description: "Model metadata, price, context, modalities, benchmark values, and history from upstream sources." };
}

const benchmarkMetrics = [
  ["Intelligence index", "intelligenceIndex"], ["Coding index", "codingIndex"], ["Agentic index", "agenticIndex"],
  ["Multilingual index", "multilingualIndex"], ["Openness index", "opennessIndex"], ["Finance & accounting", "financeIndex"],
  ["Healthcare & medical", "healthcareIndex"], ["Engineering", "engineeringIndex"], ["Legal", "legalIndex"],
  ["Economics", "economicsIndex"], ["Strategy & operations", "strategyIndex"], ["Decision", "decisionIndex"], ["Cyber", "cyberIndex"],
];

export default async function ModelDetailPage({ params }) {
  const [{ slug }, catalog] = await Promise.all([params, getCatalog()]);
  let modelId;
  try { modelId = modelIdFromSlug(slug); } catch { notFound(); }
  const model = catalog.models.find((item) => item.id === modelId);
  if (!model) notFound();
  const history = await getHistorySnapshots({ modelId: model.id, limit: 120 });
  const benchmarks = benchmarkMetrics.map(([label, key]) => ({ label, value: benchmarkValue(model, key) })).filter((item) => item.value !== null);

  return (
    <main className="page-content inner-page model-detail-page">
      <div className="page-kicker"><span>MODEL RECORD</span><span className="kicker-separator" /><span>{model.provider.toUpperCase()}</span></div>
      <Link className="back-link" href="/models"><ArrowLeft aria-hidden="true" /> All models</Link>
      <section className="model-detail-hero">
        <div><p className="eyebrow"><Braces aria-hidden="true" /> OPENROUTER CATALOG RECORD</p><h1>{model.name}</h1><p className="model-id large-id">{model.id}</p><p className="page-lede model-description">{model.description || "No description was supplied by the upstream catalog."}</p>
          <div className="detail-actions"><a className="primary-button" href={model.sourceUrl} target="_blank" rel="noreferrer">Open source record <ExternalLink aria-hidden="true" /></a>{model.huggingFaceId ? <a className="secondary-button" href={`https://huggingface.co/${model.huggingFaceId.split("/").map(encodeURIComponent).join("/")}`} target="_blank" rel="noreferrer">Hugging Face page <ArrowUpRight aria-hidden="true" /></a> : null}<Link className="secondary-button" href={`/compare?models=${encodeURIComponent(model.id)}`}>Compare model <ChartNoAxesCombined aria-hidden="true" /></Link></div></div>
        <div className="model-detail-id-card"><span className="eyebrow">SOURCE NAMESPACE</span><strong>{model.provider}</strong><span>{model.namespace}</span><Link href={`/providers/${encodeURIComponent(model.namespace)}`}>Browse namespace <ArrowUpRight aria-hidden="true" /></Link></div>
      </section>

      <section className="detail-metric-grid">
        <article className="metric-card"><div className="metric-label"><span>INPUT PRICE</span><Braces aria-hidden="true" /></div><div className="metric-value detail-price">{model.promptPricePerMillion === null ? "N/A" : formatUsd(model.promptPricePerMillion)}<span className="metric-unit">/ 1M</span></div><p>USD per 1M input tokens</p></article>
        <article className="metric-card"><div className="metric-label"><span>OUTPUT PRICE</span><Braces aria-hidden="true" /></div><div className="metric-value detail-price">{model.completionPricePerMillion === null ? "N/A" : formatUsd(model.completionPricePerMillion)}<span className="metric-unit">/ 1M</span></div><p>USD per 1M output tokens</p></article>
        <article className="metric-card"><div className="metric-label"><span>CONTEXT WINDOW</span><Layers3 aria-hidden="true" /></div><div className="metric-value detail-price">{model.contextLength ? formatCount(model.contextLength) : "N/A"}<span className="metric-unit">TOKENS</span></div><p>As listed by OpenRouter</p></article>
        <article className="metric-card"><div className="metric-label"><span>CATALOG TIMESTAMP</span><ChartNoAxesCombined aria-hidden="true" /></div><div className="metric-value detail-date">{formatDate(model.createdAt)}</div><p>Not an independently verified release date</p></article>
      </section>

      <section className="detail-grid">
        <article className="panel detail-panel"><div className="section-heading"><div><p className="eyebrow">SUPPORTED MODALITIES</p><h2>Input / output</h2></div></div><div className="detail-modalities"><div><span>INPUT</span>{model.inputModalities?.length ? model.inputModalities.map((item) => <i key={item}>{item}</i>) : <small>Not reported</small>}</div><div><span>OUTPUT</span>{model.outputModalities?.length ? model.outputModalities.map((item) => <i key={item}>{item}</i>) : <small>Not reported</small>}</div></div><p className="table-note">Capability labels are upstream metadata, not independent evaluation results.</p></article>
        <article className="panel detail-panel"><div className="section-heading"><div><p className="eyebrow">PRICE PROVENANCE</p><h2>Rate details</h2></div></div><dl className="detail-definition-list"><div><dt>Prompt</dt><dd>{model.promptPricePerMillion === null ? "Not reported" : `${formatUsd(model.promptPricePerMillion)} / 1M`}</dd></div><div><dt>Completion</dt><dd>{model.completionPricePerMillion === null ? "Not reported" : `${formatUsd(model.completionPricePerMillion)} / 1M`}</dd></div><div><dt>Cached input</dt><dd>{model.cachedInputPricePerMillion === null ? "Not reported" : `${formatUsd(model.cachedInputPricePerMillion)} / 1M`}</dd></div><div><dt>Catalog date</dt><dd>{formatDate(model.createdAt)}</dd></div></dl></article>
      </section>

      <section className="panel detail-panel benchmark-detail-panel"><div className="section-heading"><div><p className="eyebrow">ATTRIBUTED THIRD-PARTY VALUES</p><h2>Artificial Analysis indexes</h2></div><span className="source-inline">via OpenRouter catalog</span></div>{benchmarks.length ? <div className="benchmark-value-grid">{benchmarks.map(({ label, value }) => <div key={label}><span>{label}</span><strong>{value.toFixed(1)}</strong></div>)}</div> : <div className="empty-inline">No Artificial Analysis benchmark values were reported for this model.</div>}</section>

      <section className="panel detail-panel"><div className="section-heading"><div><p className="eyebrow">SUPABASE SNAPSHOTS</p><h2>Observed price history</h2></div><span className="panel-index">{history.rows.length} RECORDS</span></div><ModelHistoryChart snapshots={history.rows} />{history.rows.length ? <p className="table-note">Latest capture: {formatDate(history.rows[0].captured_at)}. Historical values are captured daily after cron is configured.</p> : <p className="table-note">No snapshots exist yet. Historical series begin after the first authenticated scheduled ingestion.</p>}{history.error ? <p className="source-error">{history.error}</p> : null}</section>

      <div className="detail-provenance"><span>SOURCE URL</span><a href={model.sourceUrl} target="_blank" rel="noreferrer">{model.sourceUrl} <ArrowUpRight aria-hidden="true" /></a></div>
    </main>
  );
}
