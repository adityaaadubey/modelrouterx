const STALE_AFTER_MS = 36 * 60 * 60 * 1000;
const ALLOWED_STATUSES = new Set(["unknown", "online", "delayed", "offline"]);
const ALLOWED_SOURCE_HOSTS = new Set(["openrouter.ai", "huggingface.co"]);

function normalizeTimestamp(value) {
  if (typeof value !== "string" || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeSourceUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_SOURCE_HOSTS.has(url.hostname) ? url.href : null;
  } catch {
    return null;
  }
}

export function normalizeSourceHealthRows(rows, now = Date.now()) {
  const requestedNow = now instanceof Date ? now.getTime() : Number(now);
  const nowMs = Number.isFinite(requestedNow) ? requestedNow : Date.now();
  const checkedAt = new Date(nowMs).toISOString();

  return (Array.isArray(rows) ? rows : []).map((row) => {
    const lastAttemptAt = normalizeTimestamp(row.last_attempt_at);
    const lastSuccessAt = normalizeTimestamp(row.last_success_at);
    const lastSuccessMs = lastSuccessAt ? Date.parse(lastSuccessAt) : null;
    const ageMs = lastSuccessMs === null ? null : Math.max(0, nowMs - lastSuccessMs);
    const stale = ageMs === null || ageMs >= STALE_AFTER_MS;
    const recordedStatus = ALLOWED_STATUSES.has(row.status) ? row.status : "unknown";
    const status = recordedStatus === "online" && stale ? "delayed" : recordedStatus;
    const recordsUpdated = Number(row.records_updated);

    return {
      name: typeof row.source_name === "string" ? row.source_name.slice(0, 120) : "Unknown source",
      sourceUrl: normalizeSourceUrl(row.source_url),
      status,
      stale,
      lastAttemptAt,
      lastSuccessAt,
      ageMinutes: ageMs === null ? null : Math.floor(ageMs / 60_000),
      recordsUpdated: Number.isSafeInteger(recordsUpdated) && recordsUpdated >= 0 ? recordsUpdated : 0,
      checkedAt,
    };
  });
}
