import assert from "node:assert/strict";
import test from "node:test";
import { buildModelDirectory, buildProviderDirectory, formatArenaCount, formatArenaScore, getDefaultTrack, getTrackLabel } from "../lib/arena-utils.js";

const rows = [
  { source_key: "a-text", model_name: "Model A", organization: "Lab One", license: "Open", source_config: "text", category: "overall", rank: 1, rating: 1450, raw: { vote_count: 100 } },
  { source_key: "a-vision", model_name: "Model A", organization: "Lab One", license: "Open", source_config: "vision", category: "overall", rank: 4, rating: 1100, raw: { vote_count: 40 } },
  { source_key: "b-text", model_name: "Model B", organization: "Lab One", license: "Proprietary", source_config: "text", category: "overall", rank: 2, rating: 1400, raw: { vote_count: 75 } },
  { source_key: "c-text", model_name: "Model C", organization: "Lab Two", license: "Open", source_config: "text", category: "overall", rank: 3, rating: 1350, raw: { vote_count: 50 } },
];

test("Arena model directory keeps provider identity and every track appearance", () => {
  const models = buildModelDirectory(rows);
  const modelA = models.find((model) => model.modelName === "Model A");
  assert.equal(models.length, 3);
  assert.equal(modelA.organization, "Lab One");
  assert.deepEqual(modelA.trackRecords.map((record) => record.source_config), ["text", "vision"]);
});

test("provider directory counts unique models and records track coverage", () => {
  const providers = buildProviderDirectory(rows);
  assert.equal(providers.find((provider) => provider.organization === "Lab One").modelCount, 2);
  assert.equal(providers.find((provider) => provider.organization === "Lab One").trackCount, 2);
  assert.equal(providers.find((provider) => provider.organization === "Lab Two").modelCount, 1);
});

test("track labels and score formatting are presentation-safe", () => {
  assert.equal(getTrackLabel("webdev"), "WebDev");
  assert.equal(formatArenaScore(85.26), "85.3");
  assert.equal(formatArenaScore(1450), "1,450");
  assert.equal(formatArenaScore(null), "—");
  assert.equal(formatArenaCount(null), "—");
  assert.equal(formatArenaCount(0), "0");
  assert.equal(getDefaultTrack(rows), "text");
});
