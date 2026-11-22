"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Route } from "lucide-react";
import { benchmarkValue, formatCount, formatUsd, modelSlug } from "@/lib/model-utils";

const tasks = [
  { id: "intelligenceIndex", label: "General intelligence index" },
  { id: "codingIndex", label: "Coding index" },
  { id: "agenticIndex", label: "Agentic index" },
];

export default function RouterWorkbench({ models }) {
  const [task, setTask] = useState("intelligenceIndex");
  const [budget, setBudget] = useState("25");
  const [minimumContext, setMinimumContext] = useState("0");
  const [openOnly, setOpenOnly] = useState(false);
  const budgetValue = budget === "" ? null : Number(budget);
  const contextValue = Number(minimumContext) || 0;

  const recommendations = useMemo(() => {
    return models
      .filter((model) => benchmarkValue(model, task) !== null)
      .filter((model) => !contextValue || (model.contextLength && model.contextLength >= contextValue))
      .filter((model) => budgetValue === null || (model.promptPricePerMillion !== null && model.promptPricePerMillion <= budgetValue))
      .filter((model) => !openOnly || Boolean(model.huggingFaceId))
      .sort((a, b) => {
        const scoreDifference = benchmarkValue(b, task) - benchmarkValue(a, task);
        if (scoreDifference) return scoreDifference;
        return (a.promptPricePerMillion ?? Number.POSITIVE_INFINITY) - (b.promptPricePerMillion ?? Number.POSITIVE_INFINITY);
      })
      .slice(0, 8);
  }, [models, task, budgetValue, contextValue, openOnly]);

  const taskLabel = tasks.find((item) => item.id === task)?.label;

  return (
    <div className="router-layout">
      <section className="panel router-controls">
        <div className="section-heading"><div><p className="eyebrow">ROUTING CONSTRAINTS</p><h2>Define the job</h2></div><Route className="section-icon" aria-hidden="true" /></div>
        <label className="router-field"><span className="field-label">TASK INDEX</span><select value={task} onChange={(event) => setTask(event.target.value)}>{tasks.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label className="router-field"><span className="field-label">MAX INPUT COST · USD / 1M TOKENS</span><input type="number" min="0" step="0.25" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="Leave blank for no limit" /></label>
        <label className="router-field"><span className="field-label">MINIMUM CONTEXT · TOKENS</span><input type="number" min="0" step="1000" value={minimumContext} onChange={(event) => setMinimumContext(event.target.value)} /></label>
        <label className="toggle-field"><input type="checkbox" checked={openOnly} onChange={(event) => setOpenOnly(event.target.checked)} /><span>Only models linked to a Hugging Face page</span></label>
        <div className="method-note"><strong>Selection logic</strong><p>Filter on the published index, input price, and context values. Rank eligible models by the selected external index; lower input price breaks ties. This is not a ModelRouterX score.</p><a href="/about/data">Read methodology <ArrowUpRight aria-hidden="true" /></a></div>
      </section>

      <section className="panel router-results">
        <div className="section-heading"><div><p className="eyebrow">SOURCE-DRIVEN SHORTLIST</p><h2>{taskLabel}</h2></div><span className="result-count">{recommendations.length} candidates</span></div>
        {recommendations.length ? (
          <ol className="recommendation-list">
            {recommendations.map((model, index) => (
              <li key={model.id}>
                <span className="recommendation-rank">{String(index + 1).padStart(2, "0")}</span>
                <div className="recommendation-main">
                  <Link href={`/models/${modelSlug(model.id)}`} className="model-name-link">{model.name}</Link>
                  <span className="model-id">{model.id}</span>
                </div>
                <div className="recommendation-metric"><span>AA INDEX</span><strong>{benchmarkValue(model, task).toFixed(1)}</strong></div>
                <div className="recommendation-metric"><span>INPUT / 1M</span><strong>{model.promptPricePerMillion === null ? "N/A" : formatUsd(model.promptPricePerMillion)}</strong></div>
                <div className="recommendation-metric"><span>CONTEXT</span><strong>{model.contextLength ? formatCount(model.contextLength) : "N/A"}</strong></div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="empty-state router-empty"><span className="empty-symbol">∅</span><h3>No model meets these constraints</h3><p>Try a larger input budget or a smaller context requirement. Models without a source-published index are intentionally excluded.</p></div>
        )}
        <p className="table-note">Source: Artificial Analysis index values surfaced by OpenRouter. Values are external and may be missing or delayed.</p>
      </section>
    </div>
  );
}
