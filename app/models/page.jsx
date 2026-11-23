import Link from "next/link";
import { ArrowUpRight, Boxes } from "lucide-react";
import ModelTable from "@/components/model-table";
import { getCatalog } from "@/lib/platform-data";

export const metadata = { title: "Model catalog · ModelRouterX", description: "Search the live OpenRouter model catalog by name, namespace, price, context, and modality." };

export default async function ModelsPage({ searchParams }) {
  const [catalog, params] = await Promise.all([getCatalog(), searchParams]);
  return (
    <main className="page-content inner-page">
      <div className="page-kicker"><span>MODEL DIRECTORY</span><span className="kicker-separator" /><span>OPENROUTER CATALOG</span></div>
      <section className="page-hero-row"><div><p className="eyebrow"><Boxes aria-hidden="true" /> LIVE INDEX</p><h1>Model catalog</h1><p className="page-lede">Search actual model records and compare reported prices, context windows, modalities, and external benchmark values.</p></div><Link className="text-link" href="/about/data">Data notes <ArrowUpRight aria-hidden="true" /></Link></section>
      {catalog.error ? <div className="source-alert" role="status">{catalog.error}</div> : null}
      <section className="panel table-panel">
        <div className="section-heading"><div><p className="eyebrow">{catalog.status.toUpperCase()} · {catalog.source}</p><h2>{catalog.total} indexed records</h2></div><span className="panel-index">CACHE ≤ 15 MIN</span></div>
        <ModelTable models={catalog.models} initialQuery={typeof params?.q === "string" ? params.q : ""} initialSort="name" initialDirection="asc" />
      </section>
      <p className="page-footnote">Namespace is inferred from the provider/model ID. Prices and capabilities are reported by OpenRouter and may change upstream.</p>
    </main>
  );
}
