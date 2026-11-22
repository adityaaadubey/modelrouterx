"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Share2 } from "lucide-react";
import CompareCharts from "@/components/compare-charts";
import { benchmarkValue, calculateCost, formatCount, formatTokens, formatUsd } from "@/lib/model-utils";

const indexRows = [
  ["Artificial Analysis intelligence index", "intelligenceIndex"],
  ["Artificial Analysis coding index", "codingIndex"],
  ["Artificial Analysis agentic index", "agenticIndex"],
  ["Artificial Analysis multilingual index", "multilingualIndex"],
  ["Artificial Analysis openness index", "opennessIndex"],
];

function displayMetric(value, format = (item) => String(item)) {
  return value === null || value === undefined ? <span className="missing-value">N/A</span> : format(value);
}

export default function CompareWorkbench({ models, initialIds = [] }) {
  const [selectedIds, setSelectedIds] = useState(() => {
    const availableIds = new Set(models.map((model) => model.id));
    const valid = initialIds.filter((id) => availableIds.has(id)).slice(0, 2);
    if (valid.length >= 2) return valid;
    const defaults = models.slice(0, 2).map((model) => model.id);
    return [...valid, ...defaults.filter((id) => !valid.includes(id))].slice(0, 2);
  });
  const [inputTokens, setInputTokens] = useState("1000000");
  const [outputTokens, setOutputTokens] = useState("250000");
  const [shareMessage, setShareMessage] = useState("");
  const selectedModels = useMemo(() => selectedIds.map((id) => models.find((model) => model.id === id)).filter(Boolean), [selectedIds, models]);

  function changeModel(index, id) {
    setSelectedIds((current) => {
      const next = [...current];
      next[index] = id;
      if (next[1 - index] === id) next[1 - index] = current[index] || models.find((model) => model.id !== id)?.id || id;
      const query = next.filter(Boolean).map(encodeURIComponent).join(",");
      window.history.replaceState(null, "", `${window.location.pathname}?models=${query}`);
      return next;
    });
  }

  async function copyShareLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage("Comparison link copied.");
    } catch {
      setShareMessage("Copy is unavailable in this browser; use the address bar URL.");
    }
  }

  useEffect(() => {
    if (!selectedIds.length) return;
    const query = selectedIds.filter(Boolean).map(encodeURIComponent).join(",");
    window.history.replaceState(null, "", `${window.location.pathname}?models=${query}`);
  }, [selectedIds]);

  const first = selectedModels[0];
  const second = selectedModels[1];

  return (
    <div className="compare-workbench">
      <section className="panel compare-select-panel">
        <div className="section-heading">
          <div><p className="eyebrow">MODEL PAIRING</p><h2>Choose two catalog models</h2></div>
          <button className="secondary-button" type="button" onClick={copyShareLink}><Share2 aria-hidden="true" />Share comparison</button>
        </div>
        <div className="compare-selectors">
          {[0, 1].map((index) => (
            <label className={`model-picker ${index === 0 ? "accent-green" : "accent-cyan"}`} key={index}>
              <span className="field-label">{index === 0 ? "MODEL A" : "MODEL B"}</span>
              <select value={selectedIds[index] || ""} onChange={(event) => changeModel(index, event.target.value)} disabled={!models.length}>
                {models.map((model) => <option key={model.id} value={model.id}>{model.name} · {model.id}</option>)}
              </select>
            </label>
          ))}
        </div>
        {shareMessage ? <p className="inline-feedback" role="status"><Check aria-hidden="true" />{shareMessage}</p> : <p className="table-note">A shareable URL updates with the selected model IDs. All fields come from the live catalog.</p>}
      </section>

      {first && second ? (
        <>
          <CompareCharts first={first} second={second} />
          <section className="panel compare-data-panel">
            <div className="section-heading">
              <div><p className="eyebrow">FIELD-BY-FIELD</p><h2>Model data</h2></div>
              <span className="source-inline">Source: OpenRouter catalog</span>
            </div>
            <div className="table-overflow">
              <table className="compare-table">
                <thead><tr><th scope="col">Metric</th><th scope="col">{first.name}</th><th scope="col">{second.name}</th></tr></thead>
                <tbody>
                  <tr><th scope="row">Input price / 1M</th><td>{displayMetric(first.promptPricePerMillion, formatUsd)}</td><td>{displayMetric(second.promptPricePerMillion, formatUsd)}</td></tr>
                  <tr><th scope="row">Output price / 1M</th><td>{displayMetric(first.completionPricePerMillion, formatUsd)}</td><td>{displayMetric(second.completionPricePerMillion, formatUsd)}</td></tr>
                  <tr><th scope="row">Context window</th><td>{displayMetric(first.contextLength, formatTokens)}</td><td>{displayMetric(second.contextLength, formatTokens)}</td></tr>
                  {indexRows.map(([label, key]) => <tr key={key}><th scope="row">{label}</th><td>{displayMetric(benchmarkValue(first, key), (value) => value.toFixed(1))}</td><td>{displayMetric(benchmarkValue(second, key), (value) => value.toFixed(1))}</td></tr>)}
                  <tr><th scope="row">Input modalities</th><td>{first.inputModalities?.length ? first.inputModalities.join(", ") : "Not reported"}</td><td>{second.inputModalities?.length ? second.inputModalities.join(", ") : "Not reported"}</td></tr>
                  <tr><th scope="row">Output modalities</th><td>{first.outputModalities?.length ? first.outputModalities.join(", ") : "Not reported"}</td><td>{second.outputModalities?.length ? second.outputModalities.join(", ") : "Not reported"}</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="panel cost-panel">
            <div className="section-heading">
              <div><p className="eyebrow">TRANSPARENT ESTIMATE</p><h2>Token cost calculator</h2></div>
              <span className="source-inline">Published input + output prices</span>
            </div>
            <div className="calculator-inputs">
              <label><span className="field-label">INPUT TOKENS</span><input type="number" min="0" step="1000" value={inputTokens} onChange={(event) => setInputTokens(event.target.value)} /></label>
              <label><span className="field-label">OUTPUT TOKENS</span><input type="number" min="0" step="1000" value={outputTokens} onChange={(event) => setOutputTokens(event.target.value)} /></label>
            </div>
            <div className="cost-results">
              {[first, second].map((model, index) => {
                const cost = calculateCost(inputTokens, outputTokens, model);
                return <div className={`cost-result ${index === 0 ? "accent-green" : "accent-cyan"}`} key={model.id}>
                  <span>{model.name}</span>
                  <strong>{cost === null ? "N/A" : formatUsd(cost)}</strong>
                  <small>{cost === null ? "Required pricing unavailable" : `${formatTokens(inputTokens)} in · ${formatTokens(outputTokens)} out`}</small>
                </div>;
              })}
            </div>
            <p className="table-note">Estimate = (input tokens × published input price + output tokens × published output price) ÷ 1,000,000. Provider-specific discounts, caching, and other fees are excluded.</p>
          </section>
        </>
      ) : (
        <div className="empty-state"><h2>Two models are needed to compare</h2><p>Load the catalog and select a pair to see actual source values.</p></div>
      )}
    </div>
  );
}
