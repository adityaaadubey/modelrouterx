"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, Calculator, Search } from "lucide-react";
import { benchmarkValue, calculateCost, formatCount, formatUsd, modelSlug } from "@/lib/model-utils";

const PAGE_SIZE = 50;

export default function PricingExplorer({ models }) {
  const [inputTokens, setInputTokens] = useState("1000000");
  const [outputTokens, setOutputTokens] = useState("250000");
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("all");
  const [sortBy, setSortBy] = useState("estimatedCost");
  const [page, setPage] = useState(0);
  const providers = useMemo(() => [...new Set(models.map((model) => model.provider))].sort(), [models]);
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return models
      .filter((model) => (!needle || `${model.name} ${model.id} ${model.provider}`.toLowerCase().includes(needle)) && (provider === "all" || model.provider === provider))
      .map((model) => ({ model, estimatedCost: calculateCost(inputTokens, outputTokens, model) }))
      .sort((a, b) => {
        if (sortBy === "name") return a.model.name.localeCompare(b.model.name);
        const left = sortBy === "inputPrice" ? a.model.promptPricePerMillion : sortBy === "context" ? a.model.contextLength : a.estimatedCost;
        const right = sortBy === "inputPrice" ? b.model.promptPricePerMillion : sortBy === "context" ? b.model.contextLength : b.estimatedCost;
        if (left === null || left === undefined) return 1;
        if (right === null || right === undefined) return -1;
        return Number(left) - Number(right);
      });
  }, [models, inputTokens, outputTokens, query, provider, sortBy]);
  const pricedRows = rows.filter((row) => row.estimatedCost !== null);
  const cheapest = pricedRows.reduce((current, row) => !current || row.estimatedCost < current.estimatedCost ? row : current, null);
  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const visibleRows = rows.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  function updateValue(setter, value) {
    setter(value);
    setPage(0);
  }

  return (
    <div className="pricing-explorer">
      <section className="pricing-calculator panel">
        <div className="section-heading"><div><p className="eyebrow"><Calculator aria-hidden="true" /> TRANSPARENT COST MODEL</p><h2>Estimate your workload</h2></div><span className="panel-index">USD · PER REQUEST</span></div>
        <div className="calculator-inputs">
          <label><span className="field-label">INPUT TOKENS</span><input type="number" min="0" step="1000" value={inputTokens} onChange={(event) => updateValue(setInputTokens, event.target.value)} /></label>
          <label><span className="field-label">OUTPUT TOKENS</span><input type="number" min="0" step="1000" value={outputTokens} onChange={(event) => updateValue(setOutputTokens, event.target.value)} /></label>
        </div>
        <p className="table-note">Estimated cost = (input tokens × published input price + output tokens × published output price) ÷ 1,000,000. Cached input, provider discounts, tool fees, and request-level charges are excluded.</p>
        <div className="pricing-highlight">{cheapest ? <><span>LOWEST PUBLISHED ESTIMATE · {cheapest.model.name}</span><strong>{formatUsd(cheapest.estimatedCost)}</strong><small>Lowest cost only for these token counts; not a quality recommendation.</small></> : <><span>NO COMPLETE PRICE RECORDS</span><strong>N/A</strong><small>Both input and output rates are required.</small></>}</div>
      </section>

      <section className="panel table-panel pricing-table-panel">
        <div className="section-heading"><div><p className="eyebrow">LIVE OPENROUTER PRICES</p><h2>{models.length} model records</h2></div><span className="panel-index">CACHE ≤ 15 MIN</span></div>
        <div className="table-controls">
          <label className="table-search"><Search aria-hidden="true" /><span className="sr-only">Search pricing models</span><input value={query} onChange={(event) => updateValue(setQuery, event.target.value)} placeholder="Search model or namespace…" /></label>
          <label className="provider-select"><span className="sr-only">Filter by namespace</span><select value={provider} onChange={(event) => updateValue(setProvider, event.target.value)}><option value="all">All namespaces</option>{providers.map((name) => <option key={name} value={name}>{name}</option>)}</select></label>
          <label className="provider-select"><span className="sr-only">Sort model prices by</span><select value={sortBy} onChange={(event) => updateValue(setSortBy, event.target.value)}><option value="estimatedCost">Estimated cost</option><option value="inputPrice">Input price</option><option value="context">Context length</option><option value="name">Model name</option></select></label>
          <span className="result-count"><strong>{rows.length}</strong> models</span>
        </div>
        <div className="table-overflow"><table className="model-table pricing-table"><thead><tr><th scope="col">Position</th><th scope="col">Model</th><th scope="col">Namespace</th><th scope="col">Input / 1M</th><th scope="col">Output / 1M</th><th scope="col">Context</th><th scope="col">AA index</th><th scope="col">Estimated cost</th></tr></thead><tbody>
          {visibleRows.map(({ model, estimatedCost }, index) => <tr key={model.id}><td className="rank-cell">{estimatedCost === null ? "N/A" : currentPage * PAGE_SIZE + index + 1}</td><td className="model-cell"><Link className="model-name-link" href={`/models/${modelSlug(model.id)}`}>{model.name}</Link><span className="model-id">{model.id}</span></td><td><span className="provider-chip">{model.provider}</span></td><td className="numeric-cell">{model.promptPricePerMillion === null ? "N/A" : formatUsd(model.promptPricePerMillion)}</td><td className="numeric-cell">{model.completionPricePerMillion === null ? "N/A" : formatUsd(model.completionPricePerMillion)}</td><td className="numeric-cell">{model.contextLength ? formatCount(model.contextLength) : "N/A"}</td><td className="numeric-cell">{benchmarkValue(model, "intelligenceIndex") === null ? "N/A" : benchmarkValue(model, "intelligenceIndex").toFixed(1)}</td><td className="numeric-cell cost-cell">{estimatedCost === null ? "N/A" : formatUsd(estimatedCost)}</td></tr>)}
        </tbody></table>{!visibleRows.length ? <div className="empty-state compact-empty"><h3>No matching models</h3><p>Try a different model name or namespace.</p></div> : null}</div>
        {rows.length > PAGE_SIZE ? <nav className="pagination-bar" aria-label="Pricing results pagination"><span>Showing {currentPage * PAGE_SIZE + 1}–{Math.min((currentPage + 1) * PAGE_SIZE, rows.length)} of {rows.length}</span><div><button type="button" disabled={currentPage === 0} onClick={() => setPage((value) => Math.max(0, value - 1))}>Previous</button><span>PAGE {currentPage + 1} / {totalPages}</span><button type="button" disabled={currentPage >= totalPages - 1} onClick={() => setPage((value) => Math.min(totalPages - 1, value + 1))}>Next</button></div></nav> : null}
        <p className="table-note">Prices and context windows are source-reported. AA index is an external Artificial Analysis value when supplied. Missing values are not treated as zero.</p>
        <Link className="panel-link" href="/about/data">Pricing methodology <ArrowUpRight aria-hidden="true" /></Link>
      </section>
    </div>
  );
}
