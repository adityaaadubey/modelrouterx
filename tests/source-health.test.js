import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSourceHealthRows } from "../lib/source-health.js";

const now = Date.parse("2026-11-23T12:00:00.000Z");

function source(overrides = {}) {
  return {
    source_name: "OpenRouter model catalog",
    source_url: "https://openrouter.ai/api/v1/models",
    status: "online",
    last_attempt_at: "2026-11-23T11:59:00.000Z",
    last_success_at: "2026-11-23T11:00:00.000Z",
    records_updated: 345,
    ...overrides,
  };
}

test("source health preserves fresh successful status and reports its age", () => {
  const [result] = normalizeSourceHealthRows([source()], now);
  assert.equal(result.status, "online");
  assert.equal(result.stale, false);
  assert.equal(result.ageMinutes, 60);
  assert.equal(result.recordsUpdated, 345);
  assert.equal(result.sourceUrl, "https://openrouter.ai/api/v1/models");
});

test("source health marks old successful syncs as delayed", () => {
  const [result] = normalizeSourceHealthRows([source({ last_success_at: "2026-11-21T23:59:00.000Z" })], now);
  assert.equal(result.status, "delayed");
  assert.equal(result.stale, true);
});

test("source health does not promote failed or unsynced sources to online", () => {
  const [failed, unsynced] = normalizeSourceHealthRows([
    source({ status: "offline", last_success_at: null }),
    source({ status: "unknown", last_success_at: null, last_attempt_at: null }),
  ], now);
  assert.equal(failed.status, "offline");
  assert.equal(failed.stale, true);
  assert.equal(unsynced.status, "unknown");
  assert.equal(unsynced.lastAttemptAt, null);
});

test("source health omits unsafe source URLs and invalid timestamps", () => {
  const [result] = normalizeSourceHealthRows([source({ source_url: "javascript:alert(1)", last_success_at: "not-a-date" })], now);
  assert.equal(result.sourceUrl, null);
  assert.equal(result.lastSuccessAt, null);
  assert.equal(result.ageMinutes, null);
});
