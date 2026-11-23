"use client";

import useSWR from "swr";
import { Radio } from "lucide-react";

async function fetchHealth(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("Source health is unavailable");
  return response.json();
}

export default function LiveSourceStatus() {
  const { data, error } = useSWR("/api/sources", fetchHealth, {
    refreshInterval: 300_000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 60_000,
  });
  const sources = data?.sources || [];
  const status = error ? "delayed" : !data ? "syncing" : sources.some((source) => source.status === "offline") ? "offline" : sources.some((source) => source.status === "delayed") ? "delayed" : sources.length ? "online" : "syncing";
  const label = error ? "HEALTH UNAVAILABLE" : !data ? "CHECKING HEALTH" : status === "online" ? "SOURCES HEALTHY" : status === "delayed" ? "DATA STALE" : status === "offline" ? "SOURCE ISSUE" : "AWAITING SYNC";

  return <span className={`live-badge source-badge status-${status}`} aria-live="polite" title="Source status from the latest scheduled database sync"><Radio aria-hidden="true" /><span>{label}</span><small>DB SYNC</small></span>;
}
