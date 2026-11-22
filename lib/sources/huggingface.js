const HUGGINGFACE_MODELS_URL = "https://huggingface.co/api/models";
const REVALIDATE_SECONDS = 900;

function finiteCount(value) {
  if (value === null || value === undefined || value === "") return null;
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : null;
}

export function normalizeHuggingFaceModel(model) {
  const id = typeof model?.modelId === "string" ? model.modelId : model?.id;
  if (typeof id !== "string" || !id.trim()) return null;

  const downloads = finiteCount(model.downloads);
  const likes = finiteCount(model.likes);
  if (downloads === null || likes === null) return null;

  return {
    id,
    name: id.split("/").at(-1) || id,
    namespace: id.includes("/") ? id.split("/")[0] : "community",
    downloads,
    likes,
    pipelineTag: typeof model.pipeline_tag === "string" ? model.pipeline_tag : null,
    libraryName: typeof model.library_name === "string" ? model.library_name : null,
    tags: Array.isArray(model.tags) ? model.tags.filter((tag) => typeof tag === "string").slice(0, 24) : [],
    createdAt: typeof model.createdAt === "string" ? model.createdAt : null,
    lastModified: typeof model.lastModified === "string" ? model.lastModified : null,
    sourceUrl: `https://huggingface.co/${id}`,
  };
}

export async function fetchHuggingFaceTrending(limit = 50) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const url = new URL(HUGGINGFACE_MODELS_URL);
  url.searchParams.set("pipeline_tag", "text-generation");
  url.searchParams.set("sort", "downloads");
  url.searchParams.set("direction", "-1");
  url.searchParams.set("limit", String(safeLimit));

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) throw new Error(`Hugging Face responded with ${response.status}`);
  const payload = await response.json();
  if (!Array.isArray(payload)) throw new Error("Hugging Face returned an unexpected model list");

  return payload.map(normalizeHuggingFaceModel).filter(Boolean);
}

export const HUGGINGFACE_SOURCE = {
  name: "Hugging Face Hub",
  url: "https://huggingface.co/api/models",
  refreshMinutes: 15,
};
