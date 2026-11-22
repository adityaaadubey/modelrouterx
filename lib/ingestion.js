import "server-only";
import { fetchOpenRouterCatalog, OPENROUTER_SOURCE } from "@/lib/sources/openrouter";
import { fetchHuggingFaceTrending, HUGGINGFACE_SOURCE } from "@/lib/sources/huggingface";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function chunks(items, size = 200) {
  const groups = [];
  for (let index = 0; index < items.length; index += size) groups.push(items.slice(index, index + size));
  return groups;
}

async function upsertBatches(client, table, rows, onConflict) {
  for (const batch of chunks(rows)) {
    const { error } = await client.from(table).upsert(batch, { onConflict });
    if (error) throw new Error(`${table} write failed`);
  }
}

async function recordSource(client, source, status, count, errorMessage = null, syncedAt = new Date().toISOString()) {
  const { error } = await client.from("data_sources").upsert(
    {
      source_name: source.name,
      source_url: source.url,
      status,
      last_attempt_at: syncedAt,
      ...(status === "online" ? { last_success_at: syncedAt } : {}),
      records_updated: count,
      error_message: errorMessage,
      updated_at: syncedAt,
    },
    { onConflict: "source_name" },
  );
  if (error) throw new Error("Source health write failed");
}

async function ingestOpenRouter(client, capturedAt) {
  const models = await fetchOpenRouterCatalog();
  const catalogRows = models.map((model) => ({
    id: model.id,
    name: model.name,
    provider: model.provider,
    description: model.description,
    model_created_at: model.createdAt,
    context_length: model.contextLength,
    prompt_price_per_million: model.promptPricePerMillion,
    completion_price_per_million: model.completionPricePerMillion,
    input_modalities: model.inputModalities,
    output_modalities: model.outputModalities,
    source_url: model.sourceUrl,
    metadata: {
      cachedInputPricePerMillion: model.cachedInputPricePerMillion,
      huggingFaceId: model.huggingFaceId,
      benchmarkSource: model.benchmarkSource,
      benchmarks: model.benchmarks,
      modelFamily: model.modelFamily,
    },
    synced_at: capturedAt,
  }));
  await upsertBatches(client, "model_catalog", catalogRows, "id");

  const snapshots = models.map((model) => ({
    model_id: model.id,
    captured_at: capturedAt,
    prompt_price_per_million: model.promptPricePerMillion,
    completion_price_per_million: model.completionPricePerMillion,
    context_length: model.contextLength,
    metadata: {
      benchmarkSource: model.benchmarkSource,
      benchmarks: model.benchmarks,
    },
  }));
  await upsertBatches(client, "model_snapshots", snapshots, "model_id,captured_at");
  await recordSource(client, OPENROUTER_SOURCE, "online", models.length, null, capturedAt);
  return models.length;
}

async function ingestHuggingFace(client, capturedAt) {
  const models = await fetchHuggingFaceTrending(100);
  const modelRows = models.map((model) => ({
    id: model.id,
    model_id: model.id,
    downloads: model.downloads,
    likes: model.likes,
    pipeline_tag: model.pipelineTag,
    library_name: model.libraryName,
    tags: model.tags,
    created_at_source: model.createdAt,
    last_modified: model.lastModified,
    source_url: model.sourceUrl,
    synced_at: capturedAt,
  }));
  await upsertBatches(client, "huggingface_models", modelRows, "id");

  const snapshots = models.map((model) => ({
    model_id: model.id,
    captured_at: capturedAt,
    downloads: model.downloads,
    likes: model.likes,
  }));
  await upsertBatches(client, "huggingface_model_snapshots", snapshots, "model_id,captured_at");
  await recordSource(client, HUGGINGFACE_SOURCE, "online", models.length, null, capturedAt);
  return models.length;
}

export async function runIngestion() {
  const supabase = getSupabaseAdmin();
  if (!supabase) throw new Error("Supabase server credentials are not configured");

  const capturedAt = new Date().toISOString();
  const sources = await Promise.allSettled([
    ingestOpenRouter(supabase, capturedAt),
    ingestHuggingFace(supabase, capturedAt),
  ]);

  const result = {
    capturedAt,
    openrouter: sources[0].status === "fulfilled" ? { status: "online", records: sources[0].value } : { status: "offline", records: 0 },
    huggingface: sources[1].status === "fulfilled" ? { status: "online", records: sources[1].value } : { status: "offline", records: 0 },
  };

  for (const [index, sourceResult] of sources.entries()) {
    if (sourceResult.status === "rejected") {
      const source = index === 0 ? OPENROUTER_SOURCE : HUGGINGFACE_SOURCE;
      const { error } = await supabase.from("data_sources").upsert(
        {
          source_name: source.name,
          source_url: source.url,
          status: "offline",
          last_attempt_at: capturedAt,
          records_updated: 0,
          error_message: "Upstream fetch or persistence failed.",
          updated_at: capturedAt,
        },
        { onConflict: "source_name" },
      );
      if (error) result.databaseWarning = "A source health status could not be recorded.";
    }
  }

  if (sources.every((source) => source.status === "rejected")) {
    throw new Error("All data sources failed to sync");
  }

  return result;
}
