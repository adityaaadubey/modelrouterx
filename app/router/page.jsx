import { ArrowRight, Route } from "lucide-react";
import RouterWorkbench from "@/components/router-workbench";
import { getCatalog } from "@/lib/platform-data";

export const metadata = { title: "Evidence-based model router · ModelRouterX", description: "Filter external model benchmark data by task, context requirement, and input cost." };

export default async function RouterPage() {
  const catalog = await getCatalog();
  return (
    <main className="page-content inner-page">
      <div className="page-kicker"><span>MODEL ROUTER</span><span className="kicker-separator" /><span>TRANSPARENT FILTERS</span></div>
      <section className="page-hero-row"><div><p className="eyebrow"><Route aria-hidden="true" /> SOURCE-DRIVEN SHORTLIST</p><h1>Route with evidence</h1><p className="page-lede">Choose a task index and hard operating constraints. Results are ordered by the external score you select; no hidden composite or inferred ratings.</p></div></section>
      {catalog.error ? <div className="source-alert" role="status">{catalog.error}</div> : null}
      <RouterWorkbench models={catalog.models} />
      <div className="notice-panel route-notice"><span className="notice-marker"><ArrowRight aria-hidden="true" /></span><p>Every shortlist is conditional on a published index value. Missing metrics, unpublished pricing, and unspecified context are never silently substituted.</p></div>
    </main>
  );
}
