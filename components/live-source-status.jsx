"use client";

import useSWR from "swr";
import { Radio } from "lucide-react";

async function fetchSource(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Source status unavailable");
  return response.json();
}

export default function LiveSourceStatus() {
  const { data, error } = useSWR("/api/models?limit=1", fetchSource, {
    refreshInterval: 300_000,
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    dedupingInterval: 60_000,
  });
  const status = error ? "offline" : data?.status || "syncing";
  const label = status === "online" ? "SOURCE ONLINE" : status === "delayed" ? "STORED COPY" : status === "offline" ? "SOURCE OFFLINE" : "CHECKING SOURCES";

  return <span className={`live-badge source-badge status-${status}`} aria-live="polite"><Radio aria-hidden="true" /><span>{label}</span><small>5M POLL</small></span>;
}
