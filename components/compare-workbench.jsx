"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Plus, Share2, X } from "lucide-react";
import CompareCharts from "@/components/compare-charts";
import { benchmarkValue, calculateCost, formatTokens, formatUsd } from "@/lib/model-utils";

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
    const valid = [...new Set(initialIds.filter((id) => availableIds.has(id)))].slice(0, 5);
    if (valid.length >= 2) return valid;
    const defaults = models.slice(0, 2).map((model) => model.id);
    return [...valid, ...defaults.filter((id) => !valid.includes(id))].slice(0, 5);
  });
  const [inputTokens, setInputTokens] = useState("1000000");
  const [outputTokens, setOutputTokens] = useState("250000");
  const [shareMessage, setShareMessage] = useState("");
  const selectedModels = useMemo(() => selectedIds.map((id) => models.find((model) => model.id === id)).filter(Boolean), [selectedIds, models]);

  function changeModel(index, id) {
    setSelectedIds((current) => {
      const next = [...current];
      const previousId = current[index];
      next[index] = id;
      const duplicateIndex = next.findIndex((selectedId, selectedIndex) => selectedIndex !== index && selectedId === id);
      if (duplicateIndex >= 0) next[duplicateIndex] = previousId || models.find((model) => !next.includes(model.id))?.id || id;
      const query = next.filter(Boolean).map(encodeURIComponent).join(",");
      window.history.replaceState(null, "", `${window.location.pathname}?models=${query}`);
      return next;
    });
  }

  function addModel() {
    setSelectedIds((current) => {
      if (current.length >= 5) return current;
      const nextModel = models.find((model) => !current.includes(model.id));
      return nextModel ? [...current, nextModel.id] : current;
    });
  }

  function removeModel(index) {
    setSelectedIds((current) => current.length <= 2 ? current : current.filter((_, itemIndex) => itemIndex !== index));
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
  const arenaRows = new Map();
  selectedModels.forEach((model, modelIndex) => {
    for (const entry of model.designArena || []) {
      const key = `${entry.arena}/${entry.category}`;
      const row = arenaRows.get(key) || { arena: entry.arena, category: entry.category, models: Array(selectedModels.length).fill(null) };
      row.models[modelIndex] = entry;
      arenaRows.set(key, row);
    }
  });

  return (
    <div className="compare-workbench">
      <section className="panel compare-select-panel">
        <div className="section-heading">
          <div><p className="eyebrow">MODEL PAIRING</p><h2>Compare 2–5 catalog models</h2></div>
          <button className="secondary-button" type="button" onClick={copyShareLink}><Share2 aria-hidden="true" />Share comparison</button>
        </div>
        <div className="compare-selectors">
          {selectedIds.map((_, index) => (
            <div className="compare-picker-row" key={index}>
              <label className={`model-picker ${index % 2 === 0 ? "accent-green" : "accent-cyan"}`}>
                <span className="field-label">MODEL {String.fromCharCode(65 + index)}</span>
                <select value={selectedIds[index] || ""} onChange={(event) => changeModel(index, event.target.value)} disabled={!models.length}>
                  {models.map((model) => <option key={model.id} value={model.id}>{model.name} · {model.id}</option>)}
                </select>
              </label>
              {selectedIds.length > 2 ? <button className="remove-model-button" type="button" onClick={() => removeModel(index)} aria-label={`Remove model ${selectedModels[index]?.name || index + 1}`}><X aria-hidden="true" /></button> : null}
            </div>
          ))}
        </div>
        <button className="secondary-button add-model-button" type="button" onClick={addModel} disabled={selectedIds.length >= 5 || selectedIds.length >= models.length}><Plus aria-hidden="true" />Add model <span>{selectedIds.length}/5</span></button>
        {shareMessage ? <p className="inline-feedback" role="status"><Check aria-hidden="true" />{shareMessage}</p> : <p className="table-note">A shareable URL updates with the selected model IDs. The comparison table and cost estimate include every selection; charts focus on the first pair.</p>}
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
                <thead><tr><th scope="col">Metric</th>{selectedModels.map((model) => <th scope="col" key={model.id}>{model.name}</th>)}</tr></thead>
                <tbody>
                  <tr><th scope="row">Input price / 1M</th>{selectedModels.map((model) => <td key={model.id}>{displayMetric(model.promptPricePerMillion, formatUsd)}</td>)}</tr>
                  <tr><th scope="row">Output price / 1M</th>{selectedModels.map((model) => <td key={model.id}>{displayMetric(model.completionPricePerMillion, formatUsd)}</td>)}</tr>
                  <tr><th scope="row">Context window</th>{selectedModels.map((model) => <td key={model.id}>{displayMetric(model.contextLength, formatTokens)}</td>)}</tr>
                  {indexRows.map(([label, key]) => <tr key={key}><th scope="row">{label}</th>{selectedModels.map((model) => <td key={model.id}>{displayMetric(benchmarkValue(model, key), (value) => value.toFixed(1))}</td>)}</tr>)}
                  {[...arenaRows.values()].map((row) => <tr key={`${row.arena}/${row.category}`}><th scope="row">Design Arena ELO · {row.arena} / {row.category}</th>{selectedModels.map((model, index) => <td key={model.id}>{displayMetric(row.models[index]?.elo, (value) => `${Number(value).toFixed(0)} · #${row.models[index].rank ?? "N/A"}`)}</td>)}</tr>)}
                  <tr><th scope="row">Input modalities</th>{selectedModels.map((model) => <td key={model.id}>{model.inputModalities?.length ? model.inputModalities.join(", ") : "Not reported"}</td>)}</tr>
                  <tr><th scope="row">Output modalities</th>{selectedModels.map((model) => <td key={model.id}>{model.outputModalities?.length ? model.outputModalities.join(", ") : "Not reported"}</td>)}</tr>
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
              {selectedModels.map((model, index) => {
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
