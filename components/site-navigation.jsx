"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "Overview" },
  { href: "/leaderboard", label: "Leaderboards" },
  { href: "/models", label: "Models" },
  { href: "/providers", label: "Providers" },
  { href: "/compare", label: "Compare" },
];

export default function SiteNavigation({ mobile = false }) {
  const pathname = usePathname();
  const className = mobile ? "mobile-nav" : "main-nav";

  return (
    <nav className={className} aria-label={mobile ? "Mobile navigation" : "Main navigation"}>
      {navigation.map((item) => {
        const active = item.href === "/" ? pathname === "/" : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={active ? "active" : undefined} aria-current={active ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
