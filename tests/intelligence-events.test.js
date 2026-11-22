import assert from "node:assert/strict";
import test from "node:test";
import { buildCatalogEvents } from "../lib/intelligence-events.js";

const capturedAt = "2026-11-23T12:00:00.000Z";

function model(overrides = {}) {
  return {
    id: "acme/thinker-1",
    name: "Thinker 1",
    provider: "Acme",
    sourceUrl: "https://openrouter.ai/acme/thinker-1",
    promptPricePerMillion: 1,
    completionPricePerMillion: 4,
    contextLength: 200_000,
    benchmarkSource: "Artificial Analysis index, syndicated in OpenRouter",
    benchmarks: { intelligenceIndex: 43.5, codingIndex: 38 },
    designArena: [{ arena: "models", category: "coding", elo: 1320, rank: 3 }],
    createdAt: null,
    ...overrides,
  };
}

function previousRow(overrides = {}) {
  return {
    id: "acme/thinker-1",
    prompt_price_per_million: 2,
    completion_price_per_million: 4,
    context_length: 100_000,
    metadata: {
      benchmarks: { intelligenceIndex: 41, codingIndex: 38 },
      designArena: [{ arena: "models", category: "coding", elo: 1290, rank: 8 }],
    },
    ...overrides,
  };
}

test("initial catalog sync establishes a baseline without inventing release events", () => {
  assert.deepEqual(buildCatalogEvents([model()], [], capturedAt), []);
});

test("catalog changes produce price, context, benchmark, and leaderboard signals", () => {
  const events = buildCatalogEvents([model()], [previousRow()], capturedAt);
  assert.deepEqual(events.map((event) => event.category).sort(), [
    "benchmark_update",
    "context_increase",
    "leaderboard_movement",
    "pricing_change",
  ]);
  assert.equal(events.find((event) => event.category === "pricing_change").importance, "high");
  assert.match(events.find((event) => event.category === "leaderboard_movement").description, /rank #8 to #3/);
  assert.ok(events.every((event) => event.source_url === "https://openrouter.ai/acme/thinker-1"));
  assert.ok(events.every((event) => event.occurred_at === capturedAt));
});

test("new catalog records are labeled as indexed, not as independently verified releases", () => {
  const newModel = model({ id: "acme/new-model", createdAt: "2026-11-20T10:00:00.000Z" });
  const event = buildCatalogEvents([newModel], [previousRow()], capturedAt)[0];
  assert.equal(event.category, "new_model");
  assert.match(event.description, /not an independently verified launch date/);
});

test("small price noise does not generate a significant pricing event", () => {
  const events = buildCatalogEvents(
    [model({ promptPricePerMillion: 1.95, contextLength: 100_000, benchmarks: { intelligenceIndex: 41, codingIndex: 38 }, designArena: [{ arena: "models", category: "coding", elo: 1290, rank: 8 }] })],
    [previousRow()],
    capturedAt,
  );
  assert.equal(events.some((event) => event.category === "pricing_change"), false);
});

test("event keys are stable for an identical observed transition", () => {
  const first = buildCatalogEvents([model()], [previousRow()], capturedAt).map((event) => event.event_key);
  const second = buildCatalogEvents([model()], [previousRow()], capturedAt).map((event) => event.event_key);
  assert.deepEqual(first, second);
});
