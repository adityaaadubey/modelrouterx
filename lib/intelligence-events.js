import { createHash } from "node:crypto";

const PRICE_CHANGE_THRESHOLD = 0.1;
const BENCHMARK_CHANGE_THRESHOLD = 0.25;
const LEADERBOARD_MOVEMENT_THRESHOLD = 3;
const PRICE_FIELDS = [
  { key: "promptPricePerMillion", column: "prompt_price_per_million", label: "Input" },
  { key: "completionPricePerMillion", column: "completion_price_per_million", label: "Output" },
];

function finiteNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function formatPrice(value) {
  if (value === null) return "not reported";
  return `$${value.toLocaleString("en-US", { maximumFractionDigits: 8 })}`;
}

function formatValue(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatBenchmarkName(value) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (character) => character.toUpperCase());
}

function eventKey(category, modelId, metadata) {
  return createHash("sha256")
    .update(JSON.stringify([category, modelId, metadata]))
    .digest("hex");
}

function createEvent(model, capturedAt, category, importance, title, description, metadata, sourceName = "OpenRouter model catalog") {
  return {
    event_key: eventKey(category, model.id, metadata),
    category,
    importance,
    title,
    description,
    provider: model.provider || "Unknown provider",
    model_id: model.id,
    source_name: sourceName,
    source_url: model.sourceUrl,
    occurred_at: capturedAt,
    metadata,
  };
}

function detectPricingEvent(model, previous, capturedAt) {
  const changes = [];
  let largestPercentChange = 0;

  for (const field of PRICE_FIELDS) {
    const from = finiteNumber(previous[field.column]);
    const to = finiteNumber(model[field.key]);
    if (from === to) continue;

    const percentChange = from !== null && from > 0 && to !== null
      ? ((to - from) / from) * 100
      : null;
    if (percentChange !== null && Math.abs(percentChange) < PRICE_CHANGE_THRESHOLD * 100) continue;

    if (percentChange !== null) largestPercentChange = Math.max(largestPercentChange, Math.abs(percentChange));
    const changeDescription = from === null && to !== null
      ? `${field.label} price is now reported at ${formatPrice(to)} per million tokens.`
      : to === null
        ? `${field.label} price is no longer reported; its previous value was ${formatPrice(from)} per million tokens.`
        : percentChange === null
          ? `${field.label} price changed from ${formatPrice(from)} to ${formatPrice(to)} per million tokens.`
          : `${field.label} price ${to < from ? "fell" : "rose"} ${Math.round(Math.abs(percentChange))}% from ${formatPrice(from)} to ${formatPrice(to)} per million tokens.`;

    changes.push({ field: field.key, from, to, percentChange, description: changeDescription });
  }

  if (!changes.length) return null;

  const primary = changes.find((change) => change.percentChange !== null) || changes[0];
  const direction = primary.to === null ? "was removed" : primary.from === null ? "is now reported" : "changed";
  const title = primary.percentChange === null
    ? `Model pricing ${direction}`
    : `${primary.field === "promptPricePerMillion" ? "Input" : "Output"} price ${primary.to < primary.from ? "fell" : "rose"} ${Math.round(Math.abs(primary.percentChange))}%`;

  return createEvent(
    model,
    capturedAt,
    "pricing_change",
    largestPercentChange >= 50 ? "high" : "medium",
    title,
    changes.map((change) => change.description).join(" "),
    { changes: changes.map(({ field, from, to, percentChange }) => ({ field, from, to, percentChange })) },
  );
}

function detectBenchmarkEvents(model, previous, capturedAt) {
  const events = [];
  const previousBenchmarks = previous.metadata?.benchmarks || {};
  const currentBenchmarks = model.benchmarks || {};
  const benchmarkChanges = [];

  for (const [key, value] of Object.entries(currentBenchmarks)) {
    const from = finiteNumber(previousBenchmarks[key]);
    const to = finiteNumber(value);
    if (to === null || from === to) continue;
    if (from !== null && Math.abs(to - from) < BENCHMARK_CHANGE_THRESHOLD) continue;
    benchmarkChanges.push({ key, from, to });
  }

  if (benchmarkChanges.length) {
    const details = benchmarkChanges.map(({ key, from, to }) =>
      `${formatBenchmarkName(key)} ${from === null ? "first reported at" : `changed from ${formatValue(from)} to`} ${formatValue(to)}`,
    );
    events.push(createEvent(
      model,
      capturedAt,
      "benchmark_update",
      benchmarkChanges.some(({ from, to }) => from !== null && Math.abs(to - from) >= 5) ? "high" : "medium",
      benchmarkChanges.length === 1 ? `${formatBenchmarkName(benchmarkChanges[0].key)} updated` : "Benchmark values updated",
      `The OpenRouter catalog now reports ${details.join("; ")}. These benchmark values are syndicated from the source identified in the catalog.`,
      { changes: benchmarkChanges },
      model.benchmarkSource || "OpenRouter model catalog",
    ));
  }

  const previousArena = new Map((previous.metadata?.designArena || []).map((entry) => [`${entry.arena}|${entry.category}`, entry]));
  for (const entry of model.designArena || []) {
    const key = `${entry.arena}|${entry.category}`;
    const prior = previousArena.get(key);
    const rank = finiteNumber(entry.rank);
    const previousRank = finiteNumber(prior?.rank);

    if (!prior && (rank !== null || finiteNumber(entry.elo) !== null)) {
      events.push(createEvent(
        model,
        capturedAt,
        "benchmark_update",
        "medium",
        "Design Arena result indexed",
        `The catalog now includes a ${entry.arena} / ${entry.category} Design Arena result${rank === null ? "" : ` at rank #${rank}`}${finiteNumber(entry.elo) === null ? "" : ` with an Elo of ${formatValue(Number(entry.elo))}`}.`,
        { arena: entry.arena, category: entry.category, rank, elo: finiteNumber(entry.elo) },
        "OpenRouter model catalog · Design Arena",
      ));
      continue;
    }

    if (!prior || rank === null || previousRank === null || rank === previousRank) continue;
    const movement = previousRank - rank;
    if (Math.abs(movement) < LEADERBOARD_MOVEMENT_THRESHOLD) continue;
    const improved = movement > 0;
    events.push(createEvent(
      model,
      capturedAt,
      "leaderboard_movement",
      Math.abs(movement) >= 8 ? "high" : "medium",
      `Design Arena rank ${improved ? "improved" : "declined"} by ${Math.abs(movement)}`,
      `${model.name} moved from rank #${previousRank} to #${rank} in the ${entry.arena} / ${entry.category} Design Arena listing.`,
      { arena: entry.arena, category: entry.category, fromRank: previousRank, toRank: rank },
      "OpenRouter model catalog · Design Arena",
    ));
  }

  return events;
}

export function buildCatalogEvents(models, previousRows, capturedAt) {
  const previousById = new Map((previousRows || []).map((row) => [row.id, row]));
  const hasBaseline = previousById.size > 0;
  const events = [];

  for (const model of models) {
    const previous = previousById.get(model.id);
    if (!previous) {
      if (hasBaseline) {
        const sourceTimestamp = model.createdAt
          ? ` The source-reported catalog timestamp is ${model.createdAt}; it is not an independently verified launch date.`
          : " The upstream catalog does not provide a model creation timestamp.";
        events.push(createEvent(
          model,
          capturedAt,
          "new_model",
          "low",
          "New model indexed in the catalog",
          `${model.name} appeared in the OpenRouter public model catalog.${sourceTimestamp}`,
          { sourceCreatedAt: model.createdAt || null },
        ));
      }
      continue;
    }

    const pricingEvent = detectPricingEvent(model, previous, capturedAt);
    if (pricingEvent) events.push(pricingEvent);

    const oldContext = finiteNumber(previous.context_length);
    const newContext = finiteNumber(model.contextLength);
    if (oldContext !== null && newContext !== null && newContext > oldContext) {
      const increase = newContext / oldContext;
      events.push(createEvent(
        model,
        capturedAt,
        "context_increase",
        increase >= 2 ? "high" : "medium",
        `Context window increased to ${formatValue(newContext)} tokens`,
        `${model.name} changed from ${formatValue(oldContext)} to ${formatValue(newContext)} context tokens in the OpenRouter catalog.`,
        { from: oldContext, to: newContext },
      ));
    }

    events.push(...detectBenchmarkEvents(model, previous, capturedAt));
  }

  return events;
}
