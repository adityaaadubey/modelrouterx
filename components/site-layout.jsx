import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import BootSequence from "@/components/boot-sequence";
import GlobalSearch from "@/components/global-search";
import HeaderShaderField from "@/components/header-shader-field";
import LiveSourceStatus from "@/components/live-source-status";
import SiteNavigation from "@/components/site-navigation";
import ThemeToggle from "@/components/theme-toggle";

export default function SiteLayout({ children, theme }) {
  return (
    <div className="site-frame">
      <a className="skip-to-content" href="#main-content">Skip to content</a>
      <BootSequence />
      <header className="topbar">
        <HeaderShaderField />
        <Link className="brand-lockup" href="/" aria-label="ModelRouterX overview">
          <Image src="/brand/modelrouterx.svg" alt="" width={34} height={34} priority />
          <span className="brand-name">MODELROUTER<span>X</span></span>
        </Link>
        <SiteNavigation />
        <div className="topbar-actions">
          <GlobalSearch />
          <ThemeToggle initialTheme={theme} />
          <LiveSourceStatus />
        </div>
      </header>
      <div className="mobile-nav-wrap"><SiteNavigation mobile /></div>
      <div id="main-content" tabIndex={-1}>{children}</div>
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
