import { CircleDollarSign } from "lucide-react";
import PricingExplorer from "@/components/pricing-explorer";
import { getCatalog } from "@/lib/platform-data";

export const metadata = { title: "Model price explorer · ModelRouterX", description: "Compare live model pricing and estimate API cost from published input and output rates." };

export default async function PricingPage() {
  const catalog = await getCatalog();
  return (
    <main className="page-content inner-page">
      <div className="page-kicker"><span>COST & CAPACITY</span><span className="kicker-separator" /><span>MODEL CATALOG</span></div>
      <section className="page-hero-row"><div><p className="eyebrow"><CircleDollarSign aria-hidden="true" /> PER-TOKEN COSTS</p><h1>Pricing intelligence</h1><p className="page-lede">Explore current model rates and estimate costs for a workload you control. The cheapest estimate is not a quality recommendation.</p></div></section>
      {catalog.error ? <div className="source-alert" role="status">{catalog.error}</div> : null}
      <PricingExplorer models={catalog.models} />
    </main>
  );
}
