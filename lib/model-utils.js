export function modelSlug(id) {
  return String(id || "").replaceAll("/", "~");
}

export function modelIdFromSlug(slug) {
  return decodeURIComponent(String(slug || "")).replaceAll("~", "/");
}

export function formatCount(value) {
  if (value === null || value === undefined || value === "") return "N/A";
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(number) : "N/A";
}

export function formatTokens(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? `${formatCount(number)} tokens` : "N/A";
}

export function formatUsd(value) {
  if (value === null || value === undefined || value === "") return "N/A";
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return "N/A";
  if (number === 0) return "$0.00";
  const digits = number < 0.01 ? 5 : number < 1 ? 3 : 2;
  return `$${number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: digits })}`;
}

export function formatDate(value) {
  if (!value) return "Not reported";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not reported" : new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(date);
}

export function calculateCost(inputTokens, outputTokens, model) {
  if (inputTokens === "" || outputTokens === "") return null;
  const input = Number(inputTokens);
  const output = Number(outputTokens);
  if (!Number.isSafeInteger(input) || !Number.isSafeInteger(output) || input < 0 || output < 0) return null;
  if (model?.promptPricePerMillion == null || model?.completionPricePerMillion == null) return null;
  return (input * Number(model.promptPricePerMillion) + output * Number(model.completionPricePerMillion)) / 1_000_000;
}

export function flattenDesignArena(models) {
  const byId = new Map(models.map((model) => [model.id, model]));
  const records = [];

  for (const model of models) {
    for (const entry of model.designArena || []) {
      if (model.id.endsWith(":batch")) {
        const baseModel = byId.get(model.id.slice(0, -6));
        const hasEquivalentBaseRecord = baseModel?.designArena?.some((candidate) =>
          candidate.arena === entry.arena &&
          candidate.category === entry.category &&
          candidate.elo === entry.elo &&
          candidate.rank === entry.rank &&
          candidate.winRate === entry.winRate
        );
        if (hasEquivalentBaseRecord) continue;
      }

      records.push({ ...entry, modelId: model.id, modelName: model.name, sourceUrl: model.sourceUrl });
    }
  }

  return records;
}

export function benchmarkValue(model, key) {
  const value = model?.benchmarks?.[key];
  return value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) ? Number(value) : null;
}

export function sortModels(models, key, direction = "desc") {
  const multiplier = direction === "asc" ? 1 : -1;
  return [...models].sort((left, right) => {
    const a = key === "name" ? left.name?.toLowerCase() || "" : Number(left[key]);
    const b = key === "name" ? right.name?.toLowerCase() || "" : Number(right[key]);
    if (typeof a === "string" && typeof b === "string") return a.localeCompare(b) * multiplier;
    if (!Number.isFinite(a)) return 1;
    if (!Number.isFinite(b)) return -1;
    return (a - b) * multiplier;
  });
}
