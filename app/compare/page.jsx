import { ArrowLeftRight } from "lucide-react";
import CompareWorkbench from "@/components/compare-workbench";
import { getCatalog } from "@/lib/platform-data";

export const metadata = { title: "Model comparison · ModelRouterX", description: "Compare live model prices, context, modalities, and source-published benchmark indexes." };

export default async function ComparePage({ searchParams }) {
  const [catalog, params] = await Promise.all([getCatalog(), searchParams]);
  const rawIds = typeof params?.models === "string" ? params.models.split(",").slice(0, 5) : [];
  const initialIds = rawIds.map((id) => {
    try { return decodeURIComponent(id); } catch { return ""; }
  }).filter(Boolean);

  return (
    <main className="page-content inner-page">
      <div className="page-kicker"><span>DECISION WORKBENCH</span><span className="kicker-separator" /><span>SOURCE VALUES ONLY</span></div>
      <section className="page-hero-row"><div><p className="eyebrow"><ArrowLeftRight aria-hidden="true" /> SIDE-BY-SIDE</p><h1>Compare models</h1><p className="page-lede">Put published benchmark values, token prices, and context windows next to each other. Estimate cost for your workload using the upstream prices.</p></div></section>
      {catalog.error ? <div className="source-alert" role="status">{catalog.error}</div> : null}
      <CompareWorkbench models={catalog.models} initialIds={initialIds} />
    </main>
  );
}
