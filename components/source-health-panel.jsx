"use client";

import useSWR from "swr";
import { ArrowUpRight, RefreshCw } from "lucide-react";

async function fetchHealth(url) {
  const response = await fetch(url, { cache: "no-store" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || "Source health is unavailable.");
  return payload;
}

function formatTimestamp(value) {
  if (!value) return "Not recorded";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function formatAge(minutes) {
  if (minutes === null || minutes === undefined) return "No successful sync yet";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

function statusLabel(status) {
  return status === "online" ? "ONLINE" : status === "delayed" ? "DELAYED" : status === "offline" ? "OFFLINE" : "AWAITING SYNC";
}

export default function SourceHealthPanel() {
  const { data, error, isLoading, mutate } = useSWR("/api/sources", fetchHealth, {
    refreshInterval: 300_000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 60_000,
  });

  return (
    <section className="panel source-health-panel" aria-labelledby="source-health-heading">
      <div className="section-heading source-health-heading">
        <div>
          <p className="eyebrow">OPERATIONAL VISIBILITY</p>
          <h2 id="source-health-heading">Source health</h2>
          <p className="source-health-intro">Status from the latest database sync. Catalog API responses are separately cached for 15 minutes.</p>
        </div>
        <button className="source-health-refresh" type="button" onClick={() => mutate()} aria-label="Refresh source health">
          <RefreshCw aria-hidden="true" />
          <span className="sr-only">Refresh</span>
        </button>
      </div>

      {error ? <p className="source-health-message" role="alert">{error.message}</p> : null}
      {isLoading && !data ? <p className="source-health-message" role="status">Loading recorded source status…</p> : null}
      {data && data.sources.length === 0 ? <p className="source-health-message" role="status">No scheduled ingestion has recorded source status yet.</p> : null}

      {data?.sources?.length ? (
        <div className="source-health-grid" aria-live="polite">
          {data.sources.map((source) => (
            <article className="source-health-card" key={source.name}>
              <div className="source-health-card-top">
                <span className="source-health-label">MONITORED SOURCE</span>
                <span className={`status-pill status-${source.status}`}><span className="status-dot" />{statusLabel(source.status)}</span>
              </div>
              <h3>{source.name}</h3>
              <dl className="source-health-details">
                <div><dt>Last attempt</dt><dd><time dateTime={source.lastAttemptAt || undefined}>{formatTimestamp(source.lastAttemptAt)}</time></dd></div>
                <div><dt>Last success</dt><dd><time dateTime={source.lastSuccessAt || undefined}>{formatTimestamp(source.lastSuccessAt)}</time></dd></div>
                <div><dt>Data age</dt><dd>{formatAge(source.ageMinutes)}</dd></div>
                <div><dt>Records last updated</dt><dd>{source.recordsUpdated.toLocaleString()}</dd></div>
              </dl>
              {source.sourceUrl ? <a className="source-health-link" href={source.sourceUrl} target="_blank" rel="noreferrer">Open source endpoint <ArrowUpRight aria-hidden="true" /></a> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
