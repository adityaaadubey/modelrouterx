import Link from "next/link";
import { ArrowUpRight, BarChart3, CircleHelp } from "lucide-react";
import { getCatalog } from "@/lib/platform-data";
import { benchmarkValue, flattenDesignArena } from "@/lib/model-utils";

export const metadata = { title: "Benchmark coverage · ModelRouterX", description: "See the external benchmark fields available in the OpenRouter model catalog and how ModelRouterX attributes them." };

const metrics = [
  { key: "intelligenceIndex", label: "Intelligence index", group: "Artificial Analysis" },
  { key: "codingIndex", label: "Coding index", group: "Artificial Analysis" },
  { key: "agenticIndex", label: "Agentic index", group: "Artificial Analysis" },
  { key: "multilingualIndex", label: "Multilingual index", group: "Artificial Analysis" },
  { key: "opennessIndex", label: "Openness index", group: "Artificial Analysis" },
  { key: "financeIndex", label: "Finance & accounting", group: "Artificial Analysis" },
  { key: "healthcareIndex", label: "Healthcare & medical", group: "Artificial Analysis" },
  { key: "engineeringIndex", label: "Engineering index", group: "Artificial Analysis" },
  { key: "legalIndex", label: "Legal index", group: "Artificial Analysis" },
  { key: "economicsIndex", label: "Economics index", group: "Artificial Analysis" },
  { key: "strategyIndex", label: "Strategy & operations", group: "Artificial Analysis" },
  { key: "decisionIndex", label: "Decision index", group: "Artificial Analysis" },
  { key: "cyberIndex", label: "Cyber index", group: "Artificial Analysis" },
];

export default async function BenchmarksPage() {
  const catalog = await getCatalog();
  const arenaTracks = new Map();
  for (const record of flattenDesignArena(catalog.models)) {
    const key = `${record.arena}/${record.category}`;
    arenaTracks.set(key, (arenaTracks.get(key) || 0) + 1);
  }
  const arenaCoverage = [...arenaTracks.entries()].map(([track, count]) => ({ track, count }));

  return (
    <main className="page-content inner-page">
      <div className="page-kicker"><span>DATA AVAILABILITY</span><span className="kicker-separator" /><span>NO SYNTHESIZED SCORES</span></div>
      <section className="page-hero-row"><div><p className="eyebrow"><BarChart3 aria-hidden="true" /> EXTERNAL INDEX COVERAGE</p><h1>Benchmark coverage</h1><p className="page-lede">See which third-party benchmark values the upstream catalog currently supplies. Every index keeps its source attribution.</p></div><Link className="text-link" href="/about/data">Methodology <ArrowUpRight aria-hidden="true" /></Link></section>
      <div className="notice-panel"><span className="notice-marker"><CircleHelp aria-hidden="true" /></span><p>ModelRouterX does not combine unrelated benchmark scales into an overall intelligence rating. The leaderboard keeps Design Arena track ELO separate from the Artificial Analysis intelligence index.</p></div>
      <section className="benchmark-coverage-grid">
        {metrics.map((metric) => {
          const count = catalog.models.filter((model) => benchmarkValue(model, metric.key) !== null).length;
          return <article className="panel coverage-card" key={metric.key}>
            <div className="coverage-card-heading"><span>{metric.group}</span><strong>{catalog.models.length ? `${Math.round((count / catalog.models.length) * 100)}%` : "N/A"}</strong></div>
            <h2>{metric.label}</h2>
            <div className="coverage-meter"><i style={{ width: catalog.models.length ? `${Math.min((count / catalog.models.length) * 100, 100)}%` : "0%" }} /></div>
            <p>{count} / {catalog.models.length} catalog records</p>
          </article>;
        })}
      </section>
      <section className="panel arena-coverage-panel">
        <div className="section-heading"><div><p className="eyebrow">TRACK-SPECIFIC ELO</p><h2>Design Arena categories</h2></div><span className="panel-index">OPENROUTER SOURCE</span></div>
        <div className="arena-coverage-grid">{arenaCoverage.map(({ track, count }) => <div className="arena-coverage-item" key={track}><span>{track.replace("/", " · ")}</span><strong>{count}</strong></div>)}</div>
        {!arenaCoverage.length ? <p className="empty-inline">No Design Arena records are currently available from the catalog.</p> : null}
      </section>
      <div className="notice-panel unavailable-benchmarks"><span className="notice-marker">i</span><p>The current source feed does not supply a general Chatbot Arena leaderboard or standalone reasoning, creativity, and instruction-following scores. Those categories are not substituted with Design Arena values.</p></div>
      <div className="benchmark-source-card"><div><span className="eyebrow">SOURCE</span><h2>Artificial Analysis and Design Arena values, syndicated by OpenRouter</h2><p>Coverage reflects non-null values in the current catalog response. Upstream sources can revise values or availability without notice.</p></div><a className="primary-button" href="https://openrouter.ai/docs/api-reference/models/list" target="_blank" rel="noreferrer">Open source docs <ArrowUpRight aria-hidden="true" /></a></div>
    </main>
  );
}
