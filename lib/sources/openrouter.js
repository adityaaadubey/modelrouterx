import { fetchJsonWithRetry } from "./fetch-json.js";

const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function dateFromUnixSeconds(value) {
  const seconds = finiteOrNull(value);
  if (seconds === null) return null;
  const date = new Date(seconds * 1000);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function providerFromModelId(id) {
  const namespace = id.split("/")[0] || "unknown";
  return namespace
    .split(/[-_]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeOpenRouterModel(model) {
  const id = typeof model?.id === "string" ? model.id.trim() : "";
  if (!id || id.length > 256 || /[\u0000-\u001f\u007f]/.test(id)) return null;

  const architecture = model.architecture || {};
  const pricing = model.pricing || {};
  const rawContextLength = finiteOrNull(model.context_length);
  const contextLength = Number.isSafeInteger(rawContextLength) && rawContextLength > 0 && rawContextLength <= 2_147_483_647
    ? rawContextLength
    : null;
  const stringList = (value) => Array.isArray(value)
    ? value.filter((entry) => typeof entry === "string").slice(0, 24).map((entry) => entry.slice(0, 120))
    : [];
  const artificialAnalysis = model.benchmarks?.artificial_analysis || null;
  const designArena = (Array.isArray(model.benchmarks?.design_arena) ? model.benchmarks.design_arena : [])
    .map((entry) => ({
      arena: typeof entry.arena === "string" ? entry.arena : null,
      category: typeof entry.category === "string" ? entry.category : null,
      elo: finiteOrNull(entry.elo),
      winRate: finiteOrNull(entry.win_rate),
      rank: finiteOrNull(entry.rank),
    }))
    .filter((entry) => entry.arena && entry.category && entry.elo !== null);
  const scale = (value) => {
    const amount = finiteOrNull(value);
    if (amount === null || amount < 0) return null;
    const scaled = amount * 1_000_000;
    return Number.isFinite(scaled) && scaled < 10_000_000_000 ? scaled : null;
  };

  return {
    id,
    slug: id.replaceAll("/", "~"),
    name: typeof model.name === "string" && model.name.trim() ? model.name.trim().slice(0, 200) : id,
    provider: providerFromModelId(id).slice(0, 120),
    namespace: id.split("/")[0] || "unknown",
    description: typeof model.description === "string" ? model.description.slice(0, 4_000) : "",
    createdAt: dateFromUnixSeconds(model.created),
    contextLength,
    promptPricePerMillion: scale(pricing.prompt),
    completionPricePerMillion: scale(pricing.completion),
    cachedInputPricePerMillion: scale(pricing.input_cache_read),
    inputModalities: stringList(architecture.input_modalities),
    outputModalities: stringList(architecture.output_modalities),
    sourceUrl: `https://openrouter.ai/${id.split("/").map(encodeURIComponent).join("/")}`,
    huggingFaceId: typeof model.hugging_face_id === "string" ? model.hugging_face_id.slice(0, 256) : null,
    benchmarkSource: artificialAnalysis ? "Artificial Analysis index, syndicated in OpenRouter" : null,
    designArena,
    benchmarks: artificialAnalysis
      ? {
          intelligenceIndex: finiteOrNull(artificialAnalysis.intelligence_index),
          codingIndex: finiteOrNull(artificialAnalysis.coding_index),
          agenticIndex: finiteOrNull(artificialAnalysis.agentic_index),
          opennessIndex: finiteOrNull(artificialAnalysis.openness_index),
          multilingualIndex: finiteOrNull(artificialAnalysis.multilingual_index),
          financeIndex: finiteOrNull(artificialAnalysis.finance_and_accounting_index),
          healthcareIndex: finiteOrNull(artificialAnalysis.healthcare_and_medical_index),
          engineeringIndex: finiteOrNull(artificialAnalysis.engineering_index),
          legalIndex: finiteOrNull(artificialAnalysis.legal_index),
          economicsIndex: finiteOrNull(artificialAnalysis.economics_index),
          strategyIndex: finiteOrNull(artificialAnalysis.strategy_and_ops_index),
          decisionIndex: finiteOrNull(artificialAnalysis.decision_index),
          cyberIndex: finiteOrNull(artificialAnalysis.cyber_index),
        }
      : null,
    modelFamily: typeof model.canonical_slug === "string" ? model.canonical_slug.slice(0, 256) : null,
  };
}

export async function fetchOpenRouterCatalog() {
  const payload = await fetchJsonWithRetry(`${OPENROUTER_MODELS_URL}?limit=1000`);
  if (!Array.isArray(payload?.data)) throw new Error("OpenRouter returned an unexpected model catalog");
  return payload.data.map(normalizeOpenRouterModel).filter(Boolean);
}

export const OPENROUTER_SOURCE = {
  name: "OpenRouter model catalog",
  url: OPENROUTER_MODELS_URL,
  refreshMinutes: 15,
};
