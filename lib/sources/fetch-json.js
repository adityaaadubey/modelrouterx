const ALLOWED_SOURCE_HOSTS = new Set(["openrouter.ai", "huggingface.co"]);
const MAX_RETRY_DELAY_MS = 2_000;
const DEFAULT_MAX_RESPONSE_BYTES = 16 * 1024 * 1024;

class UnretryableSourceError extends Error {}

function trustedUrl(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new UnretryableSourceError("Invalid upstream URL");
  }

  if (
    url.protocol !== "https:" ||
    (url.port !== "" && url.port !== "443") ||
    url.username ||
    url.password ||
    !ALLOWED_SOURCE_HOSTS.has(url.hostname)
  ) {
    throw new UnretryableSourceError("Upstream URL is not allowlisted");
  }

  return url.href;
}

function isRetryableStatus(status) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

function retryAfterMs(value) {
  if (!value) return null;
  const seconds = Number(value);
  const requestedMs = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(value) - Date.now();
  return Number.isFinite(requestedMs) && requestedMs >= 0
    ? Math.min(requestedMs, MAX_RETRY_DELAY_MS)
    : null;
}

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function readLimitedBody(response, maxResponseBytes) {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxResponseBytes) {
    throw new UnretryableSourceError("Upstream response exceeded the size limit");
  }

  if (!response.body) throw new UnretryableSourceError("Upstream response body is missing");
  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > maxResponseBytes) {
        await reader.cancel().catch(() => {});
        throw new UnretryableSourceError("Upstream response exceeded the size limit");
      }
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8", { fatal: true }).decode(body);
}

export async function fetchJsonWithRetry(sourceUrl, {
  headers = { Accept: "application/json" },
  attempts = 3,
  timeoutMs = 12_000,
  maxResponseBytes = DEFAULT_MAX_RESPONSE_BYTES,
  revalidateSeconds = 900,
} = {}) {
  const url = trustedUrl(sourceUrl);
  const safeAttempts = Math.min(Math.max(Math.floor(Number(attempts) || 3), 1), 4);
  const safeMaxBytes = Math.min(Math.max(Number(maxResponseBytes) || DEFAULT_MAX_RESPONSE_BYTES, 1_024), DEFAULT_MAX_RESPONSE_BYTES);
  let lastError;

  for (let attempt = 0; attempt < safeAttempts; attempt += 1) {
    let delayMs;
    try {
      const response = await fetch(url, {
        headers,
        redirect: "error",
        next: { revalidate: revalidateSeconds },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        if (!isRetryableStatus(response.status) || attempt === safeAttempts - 1) {
          throw new UnretryableSourceError(`Upstream request failed with status ${response.status}`);
        }
        await response.body?.cancel().catch(() => {});
        delayMs = retryAfterMs(response.headers.get("retry-after"));
      } else {
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.toLowerCase().includes("json")) {
          throw new UnretryableSourceError("Upstream response was not JSON");
        }
        const body = await readLimitedBody(response, safeMaxBytes);
        try {
          return JSON.parse(body);
        } catch (error) {
          lastError = error;
          if (attempt === safeAttempts - 1) throw error;
        }
      }
    } catch (error) {
      if (error instanceof UnretryableSourceError || attempt === safeAttempts - 1) throw error;
      lastError = error;
    }

    const backoff = Math.min(250 * (2 ** attempt) + Math.floor(Math.random() * 100), MAX_RETRY_DELAY_MS);
    await wait(delayMs ?? backoff);
  }

  throw lastError || new Error("Upstream request failed");
}
