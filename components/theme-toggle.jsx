"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

function updateThemeMetadata(theme) {
  const root = document.documentElement;
  const colorScheme = document.getElementById("mrx-color-scheme");
  const themeColor = document.getElementById("mrx-theme-color");
  if (colorScheme) colorScheme.content = theme;
  if (themeColor) themeColor.content = getComputedStyle(root).getPropertyValue("--page").trim();
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
    root.className = nextTheme;
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
