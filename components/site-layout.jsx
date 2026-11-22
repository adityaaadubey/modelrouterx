import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Radio } from "lucide-react";
import GlobalSearch from "@/components/global-search";

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/models", label: "Models" },
  { href: "/providers", label: "Providers" },
  { href: "/compare", label: "Compare" },
  { href: "/router", label: "Router" },
  { href: "/trends", label: "Trends" },
  { href: "/history", label: "History" },
  { href: "/benchmarks", label: "Benchmarks" },
];

export default function SiteLayout({ children }) {
  return (
    <div className="site-frame">
      <header className="topbar">
        <Link className="brand-lockup" href="/" aria-label="ModelRouterX overview">
          <Image src="/brand/modelrouterx.svg" alt="" width={34} height={34} priority />
          <span className="brand-name">MODELROUTER<span>X</span></span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="topbar-actions">
          <GlobalSearch />
          <span className="live-badge"><Radio aria-hidden="true" /> DATA SOURCES</span>
        </div>
      </header>
      <div className="mobile-nav-wrap">
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
      </div>
      {children}
      <footer className="site-footer">
        <div className="footer-brand">
          <Image src="/brand/modelrouterx.svg" alt="" width={22} height={22} />
          <span>MODELROUTERX / INDEPENDENT MODEL INTELLIGENCE</span>
        </div>
        <div className="footer-links">
          <Link href="/about/data">Data & methodology <ArrowUpRight aria-hidden="true" /></Link>
          <a href="https://openrouter.ai/docs/api-reference/models/list" target="_blank" rel="noreferrer">OpenRouter source <ArrowUpRight aria-hidden="true" /></a>
          <a href="https://huggingface.co/docs/hub/en/api" target="_blank" rel="noreferrer">Hugging Face source <ArrowUpRight aria-hidden="true" /></a>
        </div>
      </footer>
    </div>
  );
}
