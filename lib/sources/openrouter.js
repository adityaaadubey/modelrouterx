const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const REVALIDATE_SECONDS = 900;

function finiteOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function dateFromUnixSeconds(value) {
  const seconds = finiteOrNull(value);
  return seconds === null ? null : new Date(seconds * 1000).toISOString();
}

function providerFromModelId(id) {
  const namespace = id.split("/")[0] || "unknown";
  return namespace
    .split(/[-_]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeOpenRouterModel(model) {
  if (!model || typeof model.id !== "string" || !model.id.trim()) return null;

  const architecture = model.architecture || {};
  const pricing = model.pricing || {};
  const artificialAnalysis = model.benchmarks?.artificial_analysis || null;
  const scale = (value) => {
    const amount = finiteOrNull(value);
    return amount === null ? null : amount * 1_000_000;
  };

  return {
    id: model.id,
    slug: model.id.replaceAll("/", "~"),
    name: typeof model.name === "string" && model.name.trim() ? model.name : model.id,
    provider: providerFromModelId(model.id),
    namespace: model.id.split("/")[0] || "unknown",
    description: typeof model.description === "string" ? model.description : "",
    createdAt: dateFromUnixSeconds(model.created),
    contextLength: finiteOrNull(model.context_length) > 0 ? finiteOrNull(model.context_length) : null,
    promptPricePerMillion: scale(pricing.prompt),
    completionPricePerMillion: scale(pricing.completion),
    cachedInputPricePerMillion: scale(pricing.input_cache_read),
    inputModalities: Array.isArray(architecture.input_modalities) ? architecture.input_modalities : [],
    outputModalities: Array.isArray(architecture.output_modalities) ? architecture.output_modalities : [],
    sourceUrl: `https://openrouter.ai/${model.id}`,
    huggingFaceId: typeof model.hugging_face_id === "string" ? model.hugging_face_id : null,
    benchmarkSource: artificialAnalysis ? "Artificial Analysis index, syndicated in OpenRouter" : null,
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
    modelFamily: model.canonical_slug || null,
  };
}

export async function fetchOpenRouterCatalog() {
  let lastError;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await fetch(`${OPENROUTER_MODELS_URL}?limit=1000`, {
        headers: { Accept: "application/json" },
        next: { revalidate: REVALIDATE_SECONDS },
        signal: AbortSignal.timeout(12_000),
      });

      if (!response.ok) throw new Error(`OpenRouter responded with ${response.status}`);
      const payload = await response.json();
      if (!Array.isArray(payload?.data)) throw new Error("OpenRouter returned an unexpected model catalog");

      return payload.data.map(normalizeOpenRouterModel).filter(Boolean);
    } catch (error) {
      lastError = error;
      if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 350));
    }
  }

  throw lastError || new Error("OpenRouter catalog is unavailable");
}

export const OPENROUTER_SOURCE = {
  name: "OpenRouter model catalog",
  url: OPENROUTER_MODELS_URL,
  refreshMinutes: 15,
};
