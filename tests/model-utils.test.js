import assert from "node:assert/strict";
import test from "node:test";
import { calculateCost, formatCount, formatTokens, formatUsd, modelIdFromSlug, modelSlug } from "../lib/model-utils.js";
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

test("Hugging Face activity counts are not fabricated when missing", () => {
  assert.equal(normalizeHuggingFaceModel({ modelId: "org/model", downloads: 12, likes: 0 }).downloads, 12);
  assert.equal(normalizeHuggingFaceModel({ modelId: "org/model", likes: 0 }), null);
});
