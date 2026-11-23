import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import SiteNavigation from "@/components/site-navigation";
import ThemeToggle from "@/components/theme-toggle";

export default function SiteLayout({ children, theme }) {
  return (
    <div className="site-frame arena-site-frame">
      <a className="skip-to-content" href="#main-content">Skip to content</a>
      <header className="topbar arena-topbar">
        <Link className="brand-lockup" href="/" aria-label="ModelRouterX overview">
          <Image src="/brand/arena-signal.svg" alt="" width={36} height={36} priority />
          <span className="brand-name">modelrouter<span>x</span></span>
        </Link>
        <SiteNavigation />
        <div className="topbar-actions"><ThemeToggle initialTheme={theme} /></div>
      </header>
      <div className="mobile-nav-wrap"><SiteNavigation mobile /></div>
      <div id="main-content" tabIndex={-1}>{children}</div>
      <footer className="site-footer arena-site-footer">
        <div className="footer-brand">
          <Image src="/brand/arena-signal.svg" alt="" width={24} height={24} />
          <span>ARENA SIGNAL · INDEPENDENT PROJECT</span>
        </div>
        <div className="footer-links">
          <a href="https://lmarena.ai/leaderboard" target="_blank" rel="noreferrer">LMArena leaderboard <ArrowUpRight aria-hidden="true" /></a>
          <a href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset" target="_blank" rel="noreferrer">Public dataset <ArrowUpRight aria-hidden="true" /></a>
        </div>
      </footer>
    </div>
  );
}
