import assert from "node:assert/strict";
import test from "node:test";
import { fetchJsonWithRetry } from "../lib/sources/fetch-json.js";

test("source fetch rejects non-HTTPS and non-allowlisted destinations before requesting them", async () => {
  await assert.rejects(fetchJsonWithRetry("http://openrouter.ai/api/v1/models"), /allowlisted/);
  await assert.rejects(fetchJsonWithRetry("https://openrouter.ai.attacker.example/api/v1/models"), /allowlisted/);
  await assert.rejects(fetchJsonWithRetry("https://127.0.0.1/internal"), /allowlisted/);
});

test("source fetch retries transient upstream failures and parses JSON", async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls += 1;
    assert.equal(options.redirect, "error");
    assert.equal(options.next.revalidate, 900);
    if (calls === 1) return new Response("busy", { status: 503 });
    return new Response(JSON.stringify({ data: ["model"] }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };

  try {
    const result = await fetchJsonWithRetry("https://openrouter.ai/api/v1/models", { attempts: 2 });
    assert.deepEqual(result, { data: ["model"] });
    assert.equal(calls, 2);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("source fetch rejects oversized and non-JSON payloads", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response("x".repeat(1_025), {
    status: 200,
    headers: { "content-type": "application/json", "content-length": "1025" },
  });

  try {
    await assert.rejects(
      fetchJsonWithRetry("https://openrouter.ai/api/v1/models", { attempts: 1, maxResponseBytes: 1_024 }),
      /size limit/,
    );
    globalThis.fetch = async () => new Response("<html></html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
    await assert.rejects(fetchJsonWithRetry("https://openrouter.ai/api/v1/models", { attempts: 1 }), /not JSON/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
