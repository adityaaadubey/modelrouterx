"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";

export default function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  function submit(event) {
    event.preventDefault();
    if (event.nativeEvent.isComposing || event.keyCode === 229) return;
    const value = query.trim();
    setOpen(false);
    router.push(value ? `/models?q=${encodeURIComponent(value)}` : "/models");
  }

  return (
    <>
      <button className="search-trigger" type="button" onClick={() => setOpen(true)} aria-label="Search the model index">
        <Search aria-hidden="true" />
        <span>Search models</span>
        <kbd>⌘K</kbd>
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div className="search-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setOpen(false)}>
              <section className="search-dialog" role="dialog" aria-modal="true" aria-labelledby="search-title">
                <div className="search-dialog-head">
                  <div>
                    <p className="eyebrow">GLOBAL INDEX</p>
                    <h2 id="search-title">Find a model</h2>
                  </div>
                  <button className="icon-button" type="button" onClick={() => setOpen(false)} aria-label="Close search">
                    <X aria-hidden="true" />
                  </button>
                </div>
                <form className="search-form" onSubmit={submit}>
                  <label className="sr-only" htmlFor="global-model-search">Search models, providers, or modalities</label>
                  <Search aria-hidden="true" />
                  <input
                    id="global-model-search"
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && (event.nativeEvent.isComposing || event.keyCode === 229)) event.preventDefault();
                    }}
                    placeholder="Search model IDs, providers, modalities…"
                  />
                  <button type="submit" aria-label="Search">
                    <ArrowRight aria-hidden="true" />
                  </button>
                </form>
                <p className="search-hint">Search uses the live OpenRouter catalog. No AI-generated ranking is implied.</p>
                <div className="search-shortcuts">
                  <span><kbd>ESC</kbd> close</span>
                  <span><kbd>ENTER</kbd> search catalog</span>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
