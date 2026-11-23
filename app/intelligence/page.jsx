import { Activity, Info } from "lucide-react";
import IntelligenceFeed from "@/components/intelligence-feed";
import { getCatalog, getIntelligenceEvents } from "@/lib/platform-data";
import { formatDate } from "@/lib/model-utils";

export const metadata = {
  title: "AI intelligence feed · ModelRouterX",
  description: "Source-attributed observations of model catalog, pricing, context, benchmark, and leaderboard changes.",
};

function catalogTimestampEvents(models) {
  return models
    .filter((model) => model.createdAt)
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 50)
    .map((model) => ({
      eventKey: `catalog-timestamp:${model.id}:${model.createdAt}`,
      category: "catalog_timestamp",
      importance: "low",
      title: "Source-reported catalog timestamp",
      description: "The OpenRouter catalog reports this model-record timestamp. It is not an independently verified model launch date.",
      provider: model.provider,
      modelId: model.id,
      sourceName: "OpenRouter public model catalog",
      sourceUrl: model.sourceUrl,
      occurredAt: model.createdAt,
    }));
}

export default async function IntelligenceFeedPage() {
  const [catalog, eventHistory] = await Promise.all([getCatalog(), getIntelligenceEvents(150)]);
  const hasObservedChanges = eventHistory.rows.length > 0;
  const events = hasObservedChanges
    ? eventHistory.rows.map((event) => ({
        eventKey: event.event_key,
        category: event.category,
        importance: event.importance,
        title: event.title,
        description: event.description,
        provider: event.provider,
        modelId: event.model_id,
        sourceName: event.source_name,
        sourceUrl: event.source_url,
        occurredAt: event.occurred_at,
      }))
    : catalogTimestampEvents(catalog.models);

  const statusClass = catalog.status === "online" ? "status-online" : catalog.status === "delayed" ? "status-delayed" : "status-offline";
  const statusText = catalog.status === "online" ? "LIVE CATALOG" : catalog.status === "delayed" ? "STORED CATALOG" : "SOURCE OFFLINE";

  return (
    <main className="page-content inner-page">
      <div className="page-kicker"><span>MODEL MARKET SIGNALS</span><span className="kicker-separator" /><span>SOURCE-ATTRIBUTED</span></div>
      <section className="page-hero-row">
        <div>
          <p className="eyebrow"><Activity aria-hidden="true" /> INTELLIGENCE MONITOR</p>
          <h1>AI intelligence feed</h1>
          <p className="page-lede">Observed pricing, context, benchmark, leaderboard, and catalog changes with a traceable source for every signal.</p>
        </div>
        <span className={`status-pill ${statusClass}`}><span className="status-dot" />{statusText} · {events.length} SIGNALS</span>
      </section>

      <div className="notice-panel intelligence-notice">
        <span className="notice-marker"><Info aria-hidden="true" /></span>
        <p>
          {hasObservedChanges
            ? "Change alerts are timestamped when the ingestion pipeline observes them. The source link opens the catalog record used to verify each signal."
            : "No catalog-change history has been captured yet. Until the first baseline and follow-up sync, this view shows source-reported catalog timestamps, not verified model release dates."}
          {catalog.checkedAt ? ` Catalog checked ${formatDate(catalog.checkedAt)}.` : " The live catalog is currently unavailable."}
        </p>
      </div>

      {eventHistory.error && <p className="source-error intelligence-source-error">Stored change history is unavailable; showing only source-reported catalog timestamps where available.</p>}
      <IntelligenceFeed events={events} />
    </main>
  );
}
