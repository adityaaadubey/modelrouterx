"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search, Signal } from "lucide-react";
import { modelSlug } from "@/lib/model-utils";

const CATEGORY_FILTERS = [
  { value: "all", label: "All signals" },
  { value: "new_model", label: "New models" },
  { value: "pricing_change", label: "Pricing" },
  { value: "context_increase", label: "Context" },
  { value: "benchmark_update", label: "Benchmarks" },
  { value: "leaderboard_movement", label: "Leaderboard" },
  { value: "catalog_timestamp", label: "Catalog timestamps" },
];

const CATEGORY_LABELS = {
  new_model: "New model",
  pricing_change: "Pricing",
  context_increase: "Context window",
  benchmark_update: "Benchmark",
  leaderboard_movement: "Leaderboard",
  catalog_timestamp: "Catalog timestamp",
};

const IMPORTANCE_LABELS = {
  high: "High importance",
  medium: "Medium importance",
  low: "Catalog signal",
};

function formatTimestamp(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "Timestamp unavailable";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

function safeSourceUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "openrouter.ai" ? url.href : null;
  } catch {
    return null;
  }
}

export default function IntelligenceFeed({ events }) {
  const [category, setCategory] = useState("all");
  const [importance, setImportance] = useState("all");
  const [query, setQuery] = useState("");

  const visibleEvents = useMemo(() => {
    const search = query.trim().toLowerCase();
    return events.filter((event) => {
      if (category !== "all" && event.category !== category) return false;
      if (importance !== "all" && event.importance !== importance) return false;
      if (!search) return true;
      return [event.title, event.description, event.provider, event.modelId, event.sourceName]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(search));
    });
  }, [category, events, importance, query]);

  return (
    <section className="panel intelligence-feed-panel" aria-labelledby="feed-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow"><Signal aria-hidden="true" /> SIGNAL REGISTER</p>
          <h2 id="feed-heading">Observed model changes</h2>
        </div>
        <span className="feed-total">{events.length} SIGNALS</span>
      </div>

      <div className="intelligence-toolbar">
        <label className="intelligence-search">
          <span className="sr-only">Search intelligence events</span>
          <Search aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search provider, model, or source"
          />
        </label>
        <label className="intelligence-importance">
          <span className="sr-only">Filter by importance</span>
          <select value={importance} onChange={(event) => setImportance(event.target.value)}>
            <option value="all">Any importance</option>
            <option value="high">High importance</option>
            <option value="medium">Medium importance</option>
            <option value="low">Catalog signals</option>
          </select>
        </label>
      </div>

      <div className="intelligence-category-filters" role="group" aria-label="Filter events by category">
        {CATEGORY_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={category === filter.value ? "active" : ""}
            aria-pressed={category === filter.value}
            onClick={() => setCategory(filter.value)}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <p className="feed-result-count" aria-live="polite">
        Showing {visibleEvents.length} of {events.length} source-backed signals
      </p>

      {visibleEvents.length ? (
        <ol className="intelligence-event-list">
          {visibleEvents.map((event) => {
            const sourceUrl = safeSourceUrl(event.sourceUrl);
            return (
              <li className={`intelligence-event importance-${event.importance}`} key={event.eventKey || `${event.category}-${event.modelId}-${event.occurredAt}`}>
                <div className="intelligence-event-time">
                  <time dateTime={event.occurredAt}>{formatTimestamp(event.occurredAt)}</time>
                  <span className={`event-category category-${event.category}`}>
                    {CATEGORY_LABELS[event.category] || "Model signal"}
                  </span>
                </div>
                <div className="intelligence-event-content">
                  <div className="intelligence-event-title-row">
                    <h3>{event.title}</h3>
                    <span className={`event-importance importance-label-${event.importance}`}>
                      {IMPORTANCE_LABELS[event.importance] || "Model signal"}
                    </span>
                  </div>
                  <p className="intelligence-event-description">{event.description}</p>
                  <div className="intelligence-event-meta">
                    <span>{event.provider}</span>
                    <Link href={`/models/${modelSlug(event.modelId)}`}>{event.modelId}</Link>
                  </div>
                  <div className="intelligence-event-source">
                    <span>SOURCE · {event.sourceName}</span>
                    {sourceUrl ? (
                      <a href={sourceUrl} target="_blank" rel="noreferrer">
                        Verify source <ArrowUpRight aria-hidden="true" />
                      </a>
                    ) : <span className="source-unavailable">Source link unavailable</span>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="empty-state intelligence-empty-state">
          <h3>No signals match these filters</h3>
          <p>Try another category, importance level, or search term.</p>
        </div>
      )}
    </section>
  );
}
