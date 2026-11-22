import "server-only";
import { fetchOpenRouterCatalog } from "@/lib/sources/openrouter";
import { fetchHuggingFaceTrending } from "@/lib/sources/huggingface";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const STORED_CATALOG_COLUMNS = "id,name,provider,description,model_created_at,context_length,prompt_price_per_million,completion_price_per_million,input_modalities,output_modalities,source_url,metadata,synced_at";
const STORED_HF_COLUMNS = "id,model_id,downloads,likes,pipeline_tag,library_name,tags,created_at_source,last_modified,source_url,synced_at";

function fromStoredCatalog(row) {
  const metadata = row.metadata || {};
  return {
    id: row.id,
    slug: row.id.replaceAll("/", "~"),
    name: row.name,
    provider: row.provider,
    namespace: row.id.split("/")[0] || row.provider,
    description: row.description || "",
    createdAt: row.model_created_at,
    contextLength: row.context_length,
    promptPricePerMillion: row.prompt_price_per_million,
    completionPricePerMillion: row.completion_price_per_million,
    cachedInputPricePerMillion: metadata.cachedInputPricePerMillion ?? null,
    inputModalities: row.input_modalities || [],
    outputModalities: row.output_modalities || [],
    sourceUrl: row.source_url,
    huggingFaceId: metadata.huggingFaceId || null,
    designArena: metadata.designArena || [],
    benchmarkSource: metadata.benchmarkSource || null,
    benchmarks: metadata.benchmarks || null,
    modelFamily: metadata.modelFamily || null,
  };
}

function fromStoredHuggingFace(row) {
  return {
    id: row.id,
    name: row.model_id.split("/").at(-1) || row.model_id,
    namespace: row.model_id.includes("/") ? row.model_id.split("/")[0] : "community",
    downloads: Number(row.downloads) || 0,
    likes: Number(row.likes) || 0,
    pipelineTag: row.pipeline_tag,
    libraryName: row.library_name,
    tags: row.tags || [],
    createdAt: row.created_at_source,
    lastModified: row.last_modified,
    sourceUrl: row.source_url,
  };
}

export async function getCatalog() {
  try {
    const models = await fetchOpenRouterCatalog();
    return {
      models,
      total: models.length,
      source: "OpenRouter public model catalog",
      status: "online",
      stale: false,
      checkedAt: new Date().toISOString(),
      error: null,
    };
  } catch {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from("model_catalog")
        .select(STORED_CATALOG_COLUMNS)
        .order("synced_at", { ascending: false })
        .limit(500);

      if (!error && Array.isArray(data) && data.length) {
        return {
          models: data.map(fromStoredCatalog),
          total: data.length,
          source: "Supabase historical catalog",
          status: "delayed",
          stale: true,
          checkedAt: data[0].synced_at,
          error: "OpenRouter is temporarily unavailable; showing the last successful catalog sync.",
        };
      }
    }

    return {
      models: [],
      total: 0,
      source: "OpenRouter public model catalog",
      status: "offline",
      stale: false,
      checkedAt: null,
      error: "Model data is temporarily unavailable. No live or stored catalog could be loaded.",
    };
  }
}

export async function getTrendingModels(limit = 50) {
  try {
    const models = await fetchHuggingFaceTrending(limit);
    return {
      models,
      total: models.length,
      source: "Hugging Face Hub · sorted by downloads",
      status: "online",
      stale: false,
      checkedAt: new Date().toISOString(),
      error: null,
    };
  } catch {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data, error } = await supabase
        .from("huggingface_models")
        .select(STORED_HF_COLUMNS)
        .order("downloads", { ascending: false })
        .limit(Math.min(Math.max(limit, 1), 100));

      if (!error && Array.isArray(data) && data.length) {
        return {
          models: data.map(fromStoredHuggingFace),
          total: data.length,
          source: "Supabase · last successful Hugging Face sync",
          status: "delayed",
          stale: true,
          checkedAt: data[0].synced_at,
          error: "Hugging Face is temporarily unavailable; showing the last successful sync.",
        };
      }
    }

    return {
      models: [],
      total: 0,
      source: "Hugging Face Hub",
      status: "offline",
      stale: false,
      checkedAt: null,
      error: "Popularity data is temporarily unavailable. No live or stored Hugging Face data could be loaded.",
    };
  }
}

export async function getHistorySnapshots({ modelId, limit = 100 } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { available: false, rows: [], error: "Supabase is not configured for server-side history reads." };

  let query = supabase
    .from("model_snapshots")
    .select("model_id,captured_at,prompt_price_per_million,completion_price_per_million,context_length,metadata")
    .order("captured_at", { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 100, 1), 1000));

  if (modelId) query = query.eq("model_id", modelId);
  const { data, error } = await query;
  if (error) return { available: true, rows: [], error: "Historical snapshot query failed." };
  return { available: true, rows: data || [], error: null };
}

export async function getHuggingFaceSnapshots({ modelId, limit = 100 } = {}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { available: false, rows: [], error: "Supabase is not configured for server-side history reads." };

  let query = supabase
    .from("huggingface_model_snapshots")
    .select("model_id,captured_at,downloads,likes")
    .order("captured_at", { ascending: false })
    .limit(Math.min(Math.max(Number(limit) || 100, 1), 500));

  if (modelId) query = query.eq("model_id", modelId);
  const { data, error } = await query;
  if (error) return { available: true, rows: [], error: "Historical popularity query failed." };
  return { available: true, rows: data || [], error: null };
}
