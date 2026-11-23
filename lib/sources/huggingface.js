import { fetchJsonWithRetry } from "./fetch-json.js";

const HUGGINGFACE_MODELS_URL = "https://huggingface.co/api/models";

function finiteCount(value, maximum = Number.MAX_SAFE_INTEGER) {
  if (value === null || value === undefined || value === "") return null;
  const count = Number(value);
  return Number.isSafeInteger(count) && count >= 0 && count <= maximum ? count : null;
}

export function normalizeHuggingFaceModel(model) {
  const rawId = typeof model?.modelId === "string" ? model.modelId : model?.id;
  const id = typeof rawId === "string" ? rawId.trim() : "";
  if (!id || id.length > 256 || /[\u0000-\u001f\u007f]/.test(id)) return null;

  const downloads = finiteCount(model.downloads);
  const likes = finiteCount(model.likes, 2_147_483_647);
  if (downloads === null || likes === null) return null;

  return {
    id,
    name: id.split("/").at(-1) || id,
    namespace: id.includes("/") ? id.split("/")[0] : "community",
    downloads,
    likes,
    pipelineTag: typeof model.pipeline_tag === "string" ? model.pipeline_tag.slice(0, 120) : null,
    libraryName: typeof model.library_name === "string" ? model.library_name.slice(0, 120) : null,
    tags: Array.isArray(model.tags) ? model.tags.filter((tag) => typeof tag === "string").slice(0, 24).map((tag) => tag.slice(0, 120)) : [],
    createdAt: typeof model.createdAt === "string" ? model.createdAt : null,
    lastModified: typeof model.lastModified === "string" ? model.lastModified : null,
    sourceUrl: `https://huggingface.co/${id.split("/").map(encodeURIComponent).join("/")}`,
  };
}

export async function fetchHuggingFaceTrending(limit = 50) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 100);
  const url = new URL(HUGGINGFACE_MODELS_URL);
  url.searchParams.set("pipeline_tag", "text-generation");
  url.searchParams.set("sort", "downloads");
  url.searchParams.set("direction", "-1");
  url.searchParams.set("limit", String(safeLimit));

  const payload = await fetchJsonWithRetry(url.toString());
  if (!Array.isArray(payload)) throw new Error("Hugging Face returned an unexpected model list");

  return payload.map(normalizeHuggingFaceModel).filter(Boolean);
}

export const HUGGINGFACE_SOURCE = {
  name: "Hugging Face Hub",
  url: "https://huggingface.co/api/models",
  refreshMinutes: 15,
};
