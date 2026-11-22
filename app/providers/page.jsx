import Link from "next/link";
import { ArrowUpRight, Building2 } from "lucide-react";
import { getCatalog } from "@/lib/platform-data";

export const metadata = { title: "Provider directory · ModelRouterX", description: "Browse publisher namespaces represented in the OpenRouter model catalog." };

export default async function ProvidersPage() {
  const catalog = await getCatalog();
  const providers = [...catalog.models.reduce((map, model) => {
    const key = model.namespace || "unknown";
    if (!map.has(key)) map.set(key, { namespace: key, label: model.provider, count: 0, models: [] });
    const entry = map.get(key);
    entry.count += 1;
    entry.models.push(model);
    return map;
  }, new Map()).values()].sort((a, b) => b.count - a.count || a.namespace.localeCompare(b.namespace));

  return (
    <main className="page-content inner-page">
      <div className="page-kicker"><span>PUBLISHER DIRECTORY</span><span className="kicker-separator" /><span>OPENROUTER NAMESPACES</span></div>
      <section className="page-hero-row"><div><p className="eyebrow"><Building2 aria-hidden="true" /> PROVIDERS</p><h1>Model namespaces</h1><p className="page-lede">Browse model IDs by the namespace published in the upstream catalog. Namespace labels are not independently verified corporate identities.</p></div></section>
      <section className="provider-grid">{providers.map((provider, index) => <Link className="panel provider-card" href={`/providers/${encodeURIComponent(provider.namespace)}`} key={provider.namespace}><div className="provider-card-top"><span className="provider-index">{String(index + 1).padStart(2, "0")}</span><ArrowUpRight aria-hidden="true" /></div><h2>{provider.label}</h2><span className="provider-id">{provider.namespace}</span><div className="provider-count"><strong>{provider.count}</strong><span>catalog records</span></div></Link>)}{!providers.length ? <div className="empty-state"><h2>No provider records available</h2></div> : null}</section>
    </main>
  );
}
