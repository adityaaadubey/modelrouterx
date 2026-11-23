import assert from "node:assert/strict";
import test from "node:test";
import { calculateCost, flattenDesignArena, formatCount, formatTokens, formatUsd, modelIdFromSlug, modelSlug } from "../lib/model-utils.js";
import { normalizeOpenRouterModel } from "../lib/sources/openrouter.js";
import { normalizeHuggingFaceModel } from "../lib/sources/huggingface.js";

test("model route slugs preserve provider and model IDs", () => {
  const id = "anthropic/claude-3-7-sonnet";
  assert.equal(modelIdFromSlug(modelSlug(id)), id);
});

test("cost estimate uses actual per-million input and output rates", () => {
  const model = { promptPricePerMillion: 2, completionPricePerMillion: 8 };
  assert.equal(calculateCost(1_000_000, 250_000, model), 4);
  assert.equal(calculateCost("", 1, model), null);
  assert.equal(calculateCost(1.5, 3, model), null);
  assert.equal(calculateCost(1, 3, { promptPricePerMillion: 1 }), null);
});

test("missing catalog values remain missing instead of becoming zero", () => {
  assert.equal(formatCount(null), "N/A");
  assert.equal(formatUsd(null), "N/A");
  assert.equal(formatTokens(0), "0 tokens");
  const model = normalizeOpenRouterModel({ id: "example/model", pricing: {}, architecture: {} });
  assert.equal(model.promptPricePerMillion, null);
  assert.equal(model.completionPricePerMillion, null);
  assert.equal(model.contextLength, null);
  const unavailablePrice = normalizeOpenRouterModel({ id: "example/free", pricing: { prompt: "-1", completion: "-1" } });
  assert.equal(unavailablePrice.promptPricePerMillion, null);
  assert.equal(unavailablePrice.completionPricePerMillion, null);
});

test("OpenRouter benchmark fields retain source attribution and published values", () => {
  const model = normalizeOpenRouterModel({
    id: "example/model",
    benchmarks: { artificial_analysis: { intelligence_index: 42.5, coding_index: null } },
  });
  assert.equal(model.benchmarks.intelligenceIndex, 42.5);
  assert.equal(model.benchmarks.codingIndex, null);
  assert.match(model.benchmarkSource, /Artificial Analysis/);
});

test("Design Arena scores retain source category, ELO, rank, and win rate", () => {
  const model = normalizeOpenRouterModel({
    id: "example/design-model",
    benchmarks: { design_arena: [{ arena: "models", category: "website", elo: 1343, rank: 4, win_rate: 60 }] },
  });
  assert.deepEqual(model.designArena[0], { arena: "models", category: "website", elo: 1343, winRate: 60, rank: 4 });
});

test("identical batch variants do not duplicate source Arena ranks", () => {
  const track = [{ arena: "models", category: "website", elo: 1200, winRate: 50, rank: 3 }];
  const records = flattenDesignArena([
    { id: "org/model", name: "Model", sourceUrl: "https://openrouter.ai/org/model", designArena: track },
    { id: "org/model:batch", name: "Model (batch)", sourceUrl: "https://openrouter.ai/org/model:batch", designArena: track },
  ]);
  assert.equal(records.length, 1);
  assert.equal(records[0].modelId, "org/model");
});

test("Hugging Face activity counts are not fabricated when missing", () => {
  assert.equal(normalizeHuggingFaceModel({ modelId: "org/model", downloads: 12, likes: 0 }).downloads, 12);
  assert.equal(normalizeHuggingFaceModel({ modelId: "org/model", likes: 0 }), null);
  assert.equal(normalizeHuggingFaceModel({ modelId: "org/model", downloads: 1.5, likes: 1 }), null);
});

test("untrusted catalog values cannot overflow persisted numeric columns or crash date parsing", () => {
  const model = normalizeOpenRouterModel({
    id: " org/model name ",
    created: Number.MAX_SAFE_INTEGER,
    context_length: Number.MAX_SAFE_INTEGER,
    pricing: { prompt: Number.MAX_VALUE, completion: "0.000001" },
    architecture: { input_modalities: ["text", 4, "image"], output_modalities: ["text"] },
  });
  assert.equal(model.id, "org/model name");
  assert.equal(model.createdAt, null);
  assert.equal(model.contextLength, null);
  assert.equal(model.promptPricePerMillion, null);
  assert.equal(model.completionPricePerMillion, 1);
  assert.deepEqual(model.inputModalities, ["text", "image"]);
  assert.equal(model.sourceUrl, "https://openrouter.ai/org/model%20name");
});

test("model IDs containing control characters are rejected", () => {
  assert.equal(normalizeOpenRouterModel({ id: "org/model\nname" }), null);
});
