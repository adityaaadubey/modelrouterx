import Link from "next/link";
import { ArrowUpRight, Trophy } from "lucide-react";
import ModelTable from "@/components/model-table";
import { getCatalog } from "@/lib/platform-data";
import { benchmarkValue } from "@/lib/model-utils";

export const metadata = { title: "External benchmark index · ModelRouterX", description: "Browse model rankings based on external Artificial Analysis index values supplied through OpenRouter." };

export default async function LeaderboardPage() {
  const catalog = await getCatalog();
  const ranked = catalog.models
    .filter((model) => benchmarkValue(model, "intelligenceIndex") !== null)
    .sort((a, b) => benchmarkValue(b, "intelligenceIndex") - benchmarkValue(a, "intelligenceIndex"));

  return (
    <main className="page-content inner-page">
      <div className="page-kicker"><span>EXTERNAL RANKINGS</span><span className="kicker-separator" /><span>NO COMPOSITE SCORE</span></div>
      <section className="page-hero-row"><div><p className="eyebrow"><Trophy aria-hidden="true" /> ARTIFICIAL ANALYSIS VIA OPENROUTER</p><h1>Benchmark index</h1><p className="page-lede">Ranked by the source-published Artificial Analysis intelligence index. This is a third-party metric, not a ModelRouterX rating.</p></div><Link className="text-link" href="/benchmarks">Coverage details <ArrowUpRight aria-hidden="true" /></Link></section>
      <div className="notice-panel"><span className="notice-marker">i</span><p>Index values and coverage come from the OpenRouter model catalog, which syndicates Artificial Analysis fields where available. These values can be missing or delayed; other benchmark families are not inferred.</p></div>
      <section className="panel table-panel">
        <div className="section-heading"><div><p className="eyebrow">INTELLIGENCE INDEX · DESCENDING</p><h2>{ranked.length} models with a published value</h2></div><span className="panel-index">SOURCE ORDER: SCORE</span></div>
        {ranked.length ? <ModelTable models={ranked} initialSort="intelligenceIndex" initialDirection="desc" showRank /> : <div className="empty-state"><h2>No external index values are available</h2><p>The model catalog is live, but this source returned no intelligence-index values.</p><Link className="panel-link" href="/models">Browse model catalog <ArrowUpRight aria-hidden="true" /></Link></div>}
      </section>
      <p className="page-footnote">Ranking is limited to models with a non-null intelligence index in the current catalog response. No missing values are treated as zero.</p>
    </main>
  );
}
