"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Search } from "lucide-react";
import { benchmarkValue, formatCount, formatUsd, modelSlug } from "@/lib/model-utils";

const sortableColumns = [
  { key: "name", label: "Model" },
  { key: "provider", label: "Namespace" },
  { key: "intelligenceIndex", label: "AA index" },
  { key: "promptPricePerMillion", label: "Input / 1M" },
  { key: "completionPricePerMillion", label: "Output / 1M" },
  { key: "contextLength", label: "Context" },
];

function getValue(model, key) {
  if (key === "intelligenceIndex") return benchmarkValue(model, key);
  return model[key];
}

function SortButton({ column, sortKey, direction, onSort }) {
  const active = sortKey === column.key;
  const icon = active ? direction === "asc" ? ArrowUp : ArrowDown : ArrowUpDown;
  const Icon = icon;

  return (
    <button className="sort-button" type="button" onClick={() => onSort(column.key)} aria-label={`Sort by ${column.label}`}>
      {column.label}<Icon aria-hidden="true" />
    </button>
  );
}

export default function ModelTable({ models, initialQuery = "", initialSort = "name", initialDirection = "asc", showRank = false }) {
  const [query, setQuery] = useState(initialQuery);
  const [provider, setProvider] = useState("all");
  const [sortKey, setSortKey] = useState(initialSort);
  const [direction, setDirection] = useState(initialDirection);
  const providers = useMemo(() => [...new Set(models.map((model) => model.provider))].sort(), [models]);

  const filteredModels = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = models.filter((model) => {
      const searchable = `${model.name} ${model.id} ${model.provider} ${model.description || ""} ${(model.inputModalities || []).join(" ")} ${(model.outputModalities || []).join(" ")}`.toLowerCase();
      return (!needle || searchable.includes(needle)) && (provider === "all" || model.provider === provider);
    });

    return filtered.sort((left, right) => {
      const a = getValue(left, sortKey);
      const b = getValue(right, sortKey);
      if (a == null) return 1;
      if (b == null) return -1;
      if (typeof a === "string" && typeof b === "string") return a.localeCompare(b) * (direction === "asc" ? 1 : -1);
      return (Number(a) - Number(b)) * (direction === "asc" ? 1 : -1);
    });
  }, [models, query, provider, sortKey, direction]);

  function handleSort(key) {
    if (key === sortKey) setDirection((current) => current === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setDirection(key === "name" ? "asc" : "desc");
    }
  }

  return (
    <div className="table-shell">
      <div className="table-controls">
        <label className="table-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search the model catalog</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter model, provider, modality…" />
        </label>
        <label className="provider-select">
          <span className="sr-only">Filter by namespace</span>
          <select value={provider} onChange={(event) => setProvider(event.target.value)}>
            <option value="all">All namespaces</option>
            {providers.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
        <span className="result-count"><strong>{filteredModels.length}</strong> / {models.length} models</span>
      </div>
      <div className="table-overflow">
        <table className="model-table">
          <thead>
            <tr>
              {showRank ? <th scope="col">Rank</th> : null}
              {sortableColumns.map((column) => (
                <th scope="col" key={column.key} aria-sort={sortKey === column.key ? direction === "asc" ? "ascending" : "descending" : "none"}>
                  <SortButton column={column} sortKey={sortKey} direction={direction} onSort={handleSort} />
                </th>
              ))}
              <th scope="col">Modality</th>
              <th scope="col"><span className="sr-only">Compare</span></th>
            </tr>
          </thead>
          <tbody>
            {filteredModels.map((model, index) => (
              <tr key={model.id}>
                {showRank ? <td className="rank-cell">{index + 1}</td> : null}
                <td className="model-cell">
                  <Link href={`/models/${modelSlug(model.id)}`} className="model-name-link">{model.name}</Link>
                  <span className="model-id">{model.id}</span>
                </td>
                <td><span className="provider-chip">{model.provider}</span></td>
                <td className="numeric-cell">{benchmarkValue(model, "intelligenceIndex") === null ? <span className="missing-value">N/A</span> : benchmarkValue(model, "intelligenceIndex").toFixed(1)}</td>
                <td className="numeric-cell">{model.promptPricePerMillion === null ? <span className="missing-value">N/A</span> : formatUsd(model.promptPricePerMillion)}</td>
                <td className="numeric-cell">{model.completionPricePerMillion === null ? <span className="missing-value">N/A</span> : formatUsd(model.completionPricePerMillion)}</td>
                <td className="numeric-cell">{model.contextLength ? formatCount(model.contextLength) : <span className="missing-value">N/A</span>}</td>
                <td><div className="modality-list">{[...new Set([...(model.inputModalities || []), ...(model.outputModalities || [])])].slice(0, 3).map((item) => <span key={item}>{item}</span>)}</div></td>
                <td><Link className="table-action" href={`/compare?models=${encodeURIComponent(model.id)}`}>Compare</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredModels.length === 0 ? (
          <div className="empty-state compact-empty">
            <span className="empty-symbol">∅</span>
            <h3>No matching models</h3>
            <p>Try a different search or clear the namespace filter.</p>
          </div>
        ) : null}
      </div>
      <p className="table-note">AA index is an external Artificial Analysis value when supplied by OpenRouter; it is not a ModelRouterX score. Missing values stay N/A.</p>
    </div>
  );
}
