import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CircleDot, Crosshair, Database, Gauge, Radio, ShieldCheck, Sparkles } from "lucide-react";
import PriceScatter from "@/components/price-scatter";
import ModelTable from "@/components/model-table";
import AnimatedCounter from "@/components/animated-counter";
import { getCatalog, getTrendingModels } from "@/lib/platform-data";
import { benchmarkValue, flattenDesignArena, formatCount, formatDate, formatUsd, modelSlug } from "@/lib/model-utils";

function median(values) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function MetricCard({ label, value, unit, note, icon: Icon, counter = false }) {
  return (
    <article className="metric-card">
      <div className="metric-label"><span>{label}</span><Icon aria-hidden="true" /></div>
      <div className="metric-value">{counter ? <AnimatedCounter value={value} /> : value}{unit ? <> <span className="metric-unit">{unit}</span></> : null}</div>
      <p>{note}</p>
    </article>
  );
}

function SourcePill({ status, stale }) {
  const label = status === "online" ? "LIVE SOURCE" : status === "delayed" ? "STORED COPY" : "SOURCE OFFLINE";
  return <span className={`status-pill status-${status}`}><span className="status-dot" />{stale ? "STALE · " : ""}{label}</span>;
}

export default async function HomePage() {
  const [catalog, trending] = await Promise.all([getCatalog(), getTrendingModels(30)]);
  const models = catalog.models;
  const priced = models.filter((model) => Number.isFinite(model.promptPricePerMillion) && model.promptPricePerMillion >= 0);
  const lowestInput = [...priced].sort((a, b) => a.promptPricePerMillion - b.promptPricePerMillion)[0];
  const typicalContext = median(models.map((model) => Number(model.contextLength)).filter((value) => value > 0));
  const benchmarked = models.filter((model) => benchmarkValue(model, "intelligenceIndex") !== null);
  const highestIndex = [...benchmarked].sort((a, b) => benchmarkValue(b, "intelligenceIndex") - benchmarkValue(a, "intelligenceIndex"))[0];
  const latest = models.filter((model) => model.createdAt).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8);
  const providerCount = new Set(models.map((model) => model.namespace)).size;
  const modalityCounts = ["image", "audio", "video"].map((modality) => ({
    modality,
    count: models.filter((model) => [...(model.inputModalities || []), ...(model.outputModalities || [])].includes(modality)).length,
  }));
  const websiteArenaLeaders = flattenDesignArena(models)
    .filter((entry) => entry.arena === "models" && entry.category === "website")
    .sort((a, b) => b.elo - a.elo)
    .slice(0, 5);

  return (
    <main className="page-content dashboard-page">
      <div className="page-kicker"><span>INDEPENDENT MODEL INTELLIGENCE</span><span className="kicker-separator" /><span>BUILD 01.04 / LIVE SOURCES</span></div>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow"><span className="eyebrow-marker" />MODEL ROUTING, WITHOUT THE NOISE</p>
          <h1>Find the signal.<br /><span>Route with evidence.</span></h1>
          <p className="hero-description">A live index for model quality, capability, and cost. Benchmarks stay attributed to their source; missing data stays missing.</p>
          <div className="hero-actions">
            <Link className="primary-button" href="/leaderboard">Explore ranked models <ArrowRight aria-hidden="true" /></Link>
            <Link className="text-link" href="/about/data">How the data works <ArrowUpRight aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="hero-console" aria-label="Live data-source status">
          <div className="console-topline"><span><CircleDot aria-hidden="true" /> SYSTEM STATUS</span><SourcePill status={catalog.status} stale={catalog.stale} /></div>
          <div className="console-reading">
            <span className="console-label">MODEL CATALOG</span>
            <strong>{models.length ? <AnimatedCounter value={models.length} /> : "—"}</strong>
            <span className="console-caption">records / {catalog.source}</span>
          </div>
          <div className="console-reading split-reading">
            <div><span className="console-label">HUGGING FACE</span><strong>{trending.models.length ? <AnimatedCounter value={trending.models.length} /> : "—"}</strong><span className="console-caption">top downloaded</span></div>
            <div><span className="console-label">BENCHMARKS</span><strong>{benchmarked.length ? <AnimatedCounter value={benchmarked.length} /> : "—"}</strong><span className="console-caption">AA index records</span></div>
          </div>
          <div className="console-footer"><span><Radio aria-hidden="true" /> UPSTREAM CACHE · 15 MIN</span><span>MRX / 01</span></div>
        </div>
      </section>

      {catalog.error ? <div className="source-alert" role="status"><ShieldCheck aria-hidden="true" /><span>{catalog.error}</span></div> : null}

      <section className="metric-grid" aria-label="Catalog statistics">
        <MetricCard label="INDEXED MODELS" value={models.length} unit="" note={`${providerCount} OpenRouter namespaces`} icon={Database} counter />
        <MetricCard label="MEDIAN CONTEXT" value={typicalContext ? formatCount(typicalContext) : "N/A"} unit={typicalContext ? "TOK" : ""} note="Across published model windows" icon={Crosshair} />
        <MetricCard label="LOWEST INPUT PRICE" value={lowestInput ? formatUsd(lowestInput.promptPricePerMillion) : "N/A"} unit={lowestInput ? "/ 1M" : ""} note={lowestInput ? lowestInput.name : "No published price available"} icon={ArrowDownRight} />
        <MetricCard label="AA INDEX COVERAGE" value={models.length ? `${Math.round((benchmarked.length / models.length) * 100)}%` : "N/A"} unit="" note={`${benchmarked.length} models with external values`} icon={Gauge} />
      </section>

      <section className="overview-grid">
        <article className="panel spotlight-panel">
          <div className="section-heading">
            <div><p className="eyebrow">SOURCE-DERIVED SPOTLIGHT</p><h2>Lowest listed input cost</h2></div>
            <span className="panel-index">01 / PRICE</span>
          </div>
          {lowestInput ? (
            <>
              <p className="spotlight-model">{lowestInput.name}</p>
              <p className="model-id">{lowestInput.id}</p>
              <div className="spotlight-price"><strong>{formatUsd(lowestInput.promptPricePerMillion)}</strong><span>USD / 1M input tokens</span></div>
              <div className="spotlight-details"><span>CONTEXT <strong>{formatCount(lowestInput.contextLength)}</strong></span><span>OUTPUT <strong>{formatUsd(lowestInput.completionPricePerMillion)}</strong></span></div>
              <Link className="panel-link" href={`/models/${modelSlug(lowestInput.id)}`}>View model record <ArrowUpRight aria-hidden="true" /></Link>
            </>
          ) : <p className="empty-inline">No published price data is available at this time.</p>}
          <p className="disclaimer-line">Lowest listed cost is not a recommendation or a measure of quality.</p>
        </article>
        <article className="panel chart-panel">
          <div className="section-heading">
            <div><p className="eyebrow">COST × CAPACITY</p><h2>Price / context field</h2></div>
            <span className="panel-index">LIVE CATALOG</span>
          </div>
          <PriceScatter models={models} />
        </article>
      </section>

      <section className="panel benchmark-panel">
        <div className="section-heading">
          <div><p className="eyebrow">THIRD-PARTY BENCHMARKS</p><h2>Highest listed intelligence index</h2></div>
          <Link className="panel-link" href="/leaderboard">View rankings <ArrowRight aria-hidden="true" /></Link>
        </div>
        {highestIndex ? (
          <div className="benchmark-feature">
            <div className="benchmark-rank">01</div>
            <div className="benchmark-model"><Link href={`/models/${modelSlug(highestIndex.id)}`}>{highestIndex.name}</Link><span>{highestIndex.id}</span></div>
            <div className="benchmark-score"><strong>{benchmarkValue(highestIndex, "intelligenceIndex").toFixed(1)}</strong><span>AA INDEX</span></div>
            <div className="benchmark-source"><Sparkles aria-hidden="true" /><span>Artificial Analysis value<br />syndicated by OpenRouter</span></div>
          </div>
        ) : (
          <div className="empty-inline"><span>No benchmark values are available from the connected catalog.</span><Link href="/benchmarks">See benchmark coverage <ArrowRight aria-hidden="true" /></Link></div>
        )}
        <p className="table-note">External benchmark values are shown as published. ModelRouterX does not create a composite intelligence score.</p>
      </section>

      <section className="panel arena-preview-panel">
        <div className="section-heading"><div><p className="eyebrow">DESIGN ARENA · WEBSITE TRACK</p><h2>Top published ELO scores</h2></div><Link className="panel-link" href="/leaderboard">Browse all tracks <ArrowRight aria-hidden="true" /></Link></div>
        {websiteArenaLeaders.length ? <div className="arena-preview-list">{websiteArenaLeaders.map((entry) => <div className="arena-preview-row" key={`${entry.modelId}-${entry.category}`}><span className="arena-source-rank">{entry.rank == null ? "N/A" : `#${entry.rank}`}</span><span className="arena-preview-model"><Link href={`/models/${modelSlug(entry.modelId)}`}>{entry.modelName}</Link><small>{entry.modelId}</small></span><span className="arena-preview-score"><strong>{Number(entry.elo).toFixed(0)}</strong><small>ELO</small></span></div>)}</div> : <p className="empty-inline">No Design Arena website-track ELO values are available in the current catalog.</p>}
        <p className="table-note">Track-specific output ranking from OpenRouter&apos;s Design Arena metadata. ELO is not a general intelligence score.</p>
      </section>

      <section className="panel table-panel">
        <div className="section-heading">
          <div><p className="eyebrow">DIRECT FROM THE CATALOG</p><h2>Recently indexed models</h2></div>
          <div className="section-links"><Link className="panel-link" href="/intelligence">New in catalog <ArrowUpRight aria-hidden="true" /></Link><Link className="panel-link" href="/models">Browse all {models.length} models <ArrowRight aria-hidden="true" /></Link></div>
        </div>
        <ModelTable models={latest} initialSort="name" initialDirection="asc" />
      </section>

      <section className="lower-grid">
        <article className="panel modality-panel">
          <div className="section-heading"><div><p className="eyebrow">CAPABILITY COVERAGE</p><h2>Input / output modalities</h2></div></div>
          <div className="modality-coverage">
            {modalityCounts.map(({ modality, count }) => (
              <div key={modality} className="modality-coverage-row"><span>{modality.toUpperCase()}</span><div className="coverage-track"><i style={{ width: models.length ? `${Math.min((count / models.length) * 100, 100)}%` : "0%" }} /></div><strong>{count}</strong></div>
            ))}
          </div>
          <p className="table-note">Counts reflect modality tags supplied in the model catalog, not independent capability tests.</p>
        </article>
        <article className="panel source-panel">
          <div className="section-heading"><div><p className="eyebrow">DATA PROVENANCE</p><h2>Connected sources</h2></div></div>
          <div className="source-list">
            <div><span className={`status-dot status-dot-${catalog.status}`} /><span><strong>OpenRouter</strong><small>{catalog.source}</small></span><span className="source-status-label">{catalog.status.toUpperCase()}</span></div>
            <div><span className={`status-dot status-dot-${trending.status}`} /><span><strong>Hugging Face Hub</strong><small>Popularity sorted by downloads</small></span><span className="source-status-label">{trending.status.toUpperCase()}</span></div>
          </div>
          <div className="source-meta"><span>LAST OBSERVED</span><strong>{formatDate(catalog.checkedAt || trending.checkedAt)}</strong></div>
          <div className="section-links"><Link className="panel-link" href="/providers">Browse namespaces <ArrowUpRight aria-hidden="true" /></Link><Link className="panel-link" href="/about/data">Source notes & update policy <ArrowUpRight aria-hidden="true" /></Link></div>
        </article>
      </section>

      <section className="panel trend-preview-panel">
        <div className="section-heading"><div><p className="eyebrow">POPULARITY, NOT QUALITY</p><h2>Hugging Face · top downloads</h2></div><Link className="panel-link" href="/trends">View source leaderboard <ArrowRight aria-hidden="true" /></Link></div>
        {trending.error ? <p className="source-error">{trending.error}</p> : null}
        <div className="trend-preview-list">
          {trending.models.slice(0, 5).map((model, index) => (
            <a key={model.id} href={model.sourceUrl} target="_blank" rel="noreferrer" className="trend-preview-item">
              <span className="trend-number">{String(index + 1).padStart(2, "0")}</span><span className="trend-name">{model.id}<small>{model.pipelineTag || "Hugging Face model"}</small></span><strong>{formatCount(model.downloads)} <small>downloads</small></strong><ArrowUpRight aria-hidden="true" />
            </a>
          ))}
          {!trending.models.length ? <p className="empty-inline">No live popularity records are available.</p> : null}
        </div>
        <p className="table-note">Download totals are not performance scores. Source: Hugging Face Hub API, sorted by cumulative downloads.</p>
      </section>

      <div className="dashboard-endnote"><span><ShieldCheck aria-hidden="true" /> TRANSPARENT BY DEFAULT</span><span>ModelRouterX · no synthesized benchmark scores</span><Link href="/about/data">Data methodology <ArrowUpRight aria-hidden="true" /></Link></div>
    </main>
  );
}
