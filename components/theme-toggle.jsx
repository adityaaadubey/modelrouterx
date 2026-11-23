"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle({ initialTheme = "dark" }) {
  const [theme, setTheme] = useState(initialTheme);
  const nextTheme = theme === "dark" ? "light" : "dark";

  function toggleTheme() {
    const root = document.documentElement;
    root.dataset.theme = nextTheme;
    root.classList.toggle("dark", nextTheme === "dark");
    root.classList.toggle("light", nextTheme === "light");

    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = `mrx-theme=${nextTheme}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={`Switch to ${nextTheme} theme`}
      aria-pressed={theme === "light"}
      title={`Switch to ${nextTheme === "light" ? "Light Paper" : "Dark Dusk"} terminal mode`}
    >
      {theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
      <span className="sr-only">Switch to {nextTheme} theme</span>
    </button>
  );
}
