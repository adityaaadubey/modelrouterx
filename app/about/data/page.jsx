import Link from "next/link";
import { ArrowUpRight, Database, FileCheck2, Fingerprint, ShieldCheck } from "lucide-react";

export const metadata = { title: "Data & methodology · ModelRouterX", description: "Review ModelRouterX data sources, ranking rules, refresh windows, and privacy boundaries." };

const principles = [
  { icon: Database, title: "Source values stay attributed", body: "Catalog metadata and listed prices come from OpenRouter. Hugging Face downloads and likes come from its Hub API. External Artificial Analysis indices are labeled as such." },
  { icon: FileCheck2, title: "No synthetic overall score", body: "ModelRouterX does not combine benchmark scales into a new intelligence rating. The leaderboard sorts only models with a source-published index value." },
  { icon: Fingerprint, title: "Missing remains missing", body: "Unknown prices, context windows, and benchmark values render as N/A. They are never replaced with zero or guessed from a neighboring model." },
  { icon: ShieldCheck, title: "Database writes stay server-side", body: "Supabase tables have row-level security enabled with no anonymous or authenticated grants. A server-only service key is used only for the scheduled ingestion route." },
];

export default function DataMethodologyPage() {
  return (
    <main className="page-content inner-page">
      <div className="page-kicker"><span>TRUST & PROVENANCE</span><span className="kicker-separator" /><span>LAST UPDATED 2026.11</span></div>
      <section className="page-hero-row"><div><p className="eyebrow"><ShieldCheck aria-hidden="true" /> OPEN METHODS</p><h1>Data, without the black box.</h1><p className="page-lede">ModelRouterX is an evidence index, not an oracle. Every visible metric should be traceable to a source and a clearly stated rule.</p></div></section>
      <section className="principle-grid">{principles.map(({ icon: Icon, title, body }, index) => <article className="panel principle-card" key={title}><span className="principle-index">0{index + 1}</span><Icon aria-hidden="true" /><h2>{title}</h2><p>{body}</p></article>)}</section>
      <section className="panel methodology-panel">
        <div className="section-heading"><div><p className="eyebrow">SOURCE REGISTER</p><h2>Where the numbers come from</h2></div></div>
        <div className="source-register">
          <div><span>01 / MODEL DIRECTORY</span><strong>OpenRouter public model API</strong><p>Model IDs, display names, descriptions, context windows, input/output modalities, published per-token prices, catalog timestamps, and syndicated benchmark fields.</p><a href="https://openrouter.ai/docs/api-reference/models/list" target="_blank" rel="noreferrer">API reference <ArrowUpRight aria-hidden="true" /></a></div>
          <div><span>02 / POPULARITY</span><strong>Hugging Face Hub models API</strong><p>Text-generation models ordered by cumulative downloads. Downloads and likes are popularity signals only, not a proxy for intelligence or quality.</p><a href="https://huggingface.co/docs/hub/en/api" target="_blank" rel="noreferrer">API reference <ArrowUpRight aria-hidden="true" /></a></div>
          <div><span>03 / THIRD-PARTY INDEX</span><strong>Artificial Analysis values via OpenRouter</strong><p>Displayed exactly as returned for each model. The ranked view uses the intelligence index only; coding and agentic indices are available as separate router filters.</p><Link href="/benchmarks">View current coverage <ArrowUpRight aria-hidden="true" /></Link></div>
        </div>
      </section>
      <section className="policy-grid">
        <article className="panel policy-card"><p className="eyebrow">REFRESH WINDOW</p><h2>15 minutes for live catalog calls</h2><p>Next.js revalidates source responses on a 15-minute cache. Supabase snapshots are designed to be persisted once daily by Vercel Cron after the project-level CRON_SECRET is configured.</p></article>
        <article className="panel policy-card"><p className="eyebrow">COST ESTIMATES</p><h2>Published rates, transparent math</h2><p>Cost estimates multiply requested input and output token counts by the published per-million-token rates. They exclude provider-specific discounts, cached tokens, tool fees, taxes, and request-level charges.</p></article>
      </section>
      <div className="notice-panel"><span className="notice-marker">i</span><p>Upstream model catalogs and third-party indices can change independently. This interface does not imply endorsement by OpenRouter, Hugging Face, or Artificial Analysis.</p></div>
    </main>
  );
}
