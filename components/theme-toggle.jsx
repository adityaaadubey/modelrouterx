"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

function updateThemeMetadata(theme) {
  const root = document.documentElement;
  const page = getComputedStyle(root).getPropertyValue("--page").trim();
  document.querySelectorAll('meta[name="color-scheme"]').forEach((meta) => { meta.content = theme; });
  if (page) {
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => { meta.content = page; });
  }
}

export default function ThemeToggle({ initialTheme = "dark" }) {
  const [theme, setTheme] = useState(initialTheme);

  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);

  const nextTheme = theme === "dark" ? "light" : "dark";

  function toggleTheme() {
    const root = document.documentElement;
    root.dataset.theme = nextTheme;
    root.classList.toggle("dark", nextTheme === "dark");
    root.classList.toggle("light", nextTheme === "light");
    root.style.colorScheme = nextTheme;
    updateThemeMetadata(nextTheme);

    try {
      window.localStorage.setItem("veyralabs_theme", nextTheme);
    } catch {}

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `mrx-theme=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} mode`}
      aria-pressed={theme === "light"}
      title={`Switch to ${nextTheme} mode`}
    >
      {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      <span className="sr-only">Switch to {nextTheme} mode</span>
    </button>
  );
}
