import Link from "next/link";
import { ArrowUpRight, Trophy } from "lucide-react";
import ArenaLeaderboard from "@/components/arena-leaderboard";
import ModelTable from "@/components/model-table";
import { getCatalog } from "@/lib/platform-data";
import { benchmarkValue, flattenDesignArena } from "@/lib/model-utils";

export const metadata = { title: "Model leaderboards · ModelRouterX", description: "Explore source-published Design Arena ELO categories and Artificial Analysis model indexes." };

export default async function LeaderboardPage({ searchParams }) {
  const [catalog, params] = await Promise.all([getCatalog(), searchParams]);
  const view = params?.view === "intelligence" ? "intelligence" : "arena";
  const arenaRows = flattenDesignArena(catalog.models);
  const ranked = catalog.models
    .filter((model) => benchmarkValue(model, "intelligenceIndex") !== null)
    .sort((a, b) => benchmarkValue(b, "intelligenceIndex") - benchmarkValue(a, "intelligenceIndex"));

  return (
    <main className="page-content inner-page">
      <div className="page-kicker"><span>EXTERNAL RANKINGS</span><span className="kicker-separator" /><span>NO COMPOSITE SCORE</span></div>
      <section className="page-hero-row"><div><p className="eyebrow"><Trophy aria-hidden="true" /> OPENROUTER-SYNDICATED SOURCES</p><h1>{view === "arena" ? "Arena leaderboards" : "Artificial Analysis index"}</h1><p className="page-lede">{view === "arena" ? "Explore source-published Design Arena ELO rankings across model and agent categories." : "Rank by the external Artificial Analysis intelligence index supplied by OpenRouter."}</p></div><Link className="text-link" href="/benchmarks">Coverage details <ArrowUpRight aria-hidden="true" /></Link></section>
      <nav className="leaderboard-mode-switch" aria-label="Leaderboard source">
        <Link className={view === "arena" ? "active" : ""} href="/leaderboard">Design Arena ELO</Link>
        <Link className={view === "intelligence" ? "active" : ""} href="/leaderboard?view=intelligence">Artificial Analysis index</Link>
      </nav>
      <div className="notice-panel"><span className="notice-marker">i</span><p>{view === "arena" ? "Design Arena ELO is track-specific (for example, website, coding categories, 3D, and agent tasks). Scores across categories are not directly comparable. This is not the general Chatbot Arena leaderboard." : "These are third-party index values from the OpenRouter catalog, not a ModelRouterX rating. Missing values remain unranked."}</p></div>
      <section className="panel table-panel">
        <div className="section-heading"><div><p className="eyebrow">{view === "arena" ? "DESIGN ARENA · CATEGORY-SPECIFIC ELO" : "ARTIFICIAL ANALYSIS · INTELLIGENCE INDEX"}</p><h2>{view === "arena" ? `${arenaRows.length} source-ranked track records` : `${ranked.length} models with a published value`}</h2></div><span className="panel-index">SOURCE VALUES</span></div>
        {view === "arena" ? (arenaRows.length ? <ArenaLeaderboard rows={arenaRows} /> : <div className="empty-state"><h2>No Design Arena records are available</h2><p>The live catalog returned no track-specific ELO values.</p></div>) : (ranked.length ? <ModelTable models={ranked} initialSort="intelligenceIndex" initialDirection="desc" showRank /> : <div className="empty-state"><h2>No external index values are available</h2><p>The model catalog is live, but this source returned no intelligence-index values.</p></div>)}
      </section>
      <p className="page-footnote">Only records with a source-published rank or numeric score appear. No missing scores are inferred or converted to zero.</p>
    </main>
  );
}
