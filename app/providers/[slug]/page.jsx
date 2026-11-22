import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Building2 } from "lucide-react";
import ModelTable from "@/components/model-table";
import { getCatalog } from "@/lib/platform-data";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  return { title: `${decodeURIComponent(slug)} namespace · ModelRouterX`, description: `Models listed under the ${decodeURIComponent(slug)} namespace in OpenRouter.` };
}

export default async function ProviderProfilePage({ params }) {
  const [{ slug }, catalog] = await Promise.all([params, getCatalog()]);
  const namespace = decodeURIComponent(slug);
  const models = catalog.models.filter((model) => model.namespace.toLowerCase() === namespace.toLowerCase());
  if (!models.length) notFound();

  return (
    <main className="page-content inner-page">
      <div className="page-kicker"><span>PROVIDER NAMESPACE</span><span className="kicker-separator" /><span>{namespace.toUpperCase()}</span></div>
      <Link className="back-link" href="/providers"><ArrowLeft aria-hidden="true" /> All namespaces</Link>
      <section className="page-hero-row"><div><p className="eyebrow"><Building2 aria-hidden="true" /> OPENROUTER NAMESPACE</p><h1>{models[0].provider}</h1><p className="page-lede">{models.length} model records currently use the <code>{namespace}</code> namespace in the upstream catalog.</p></div><span className="status-pill status-online"><span className="status-dot" />LIVE CATALOG</span></section>
      <section className="panel table-panel"><div className="section-heading"><div><p className="eyebrow">MODEL RECORDS</p><h2>{models.length} models</h2></div><a className="text-link" href={`https://openrouter.ai/${namespace}`} target="_blank" rel="noreferrer">Open source index <ArrowUpRight aria-hidden="true" /></a></div><ModelTable models={models} /></section>
    </main>
  );
}
