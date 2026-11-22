import { getCatalog } from "@/lib/platform-data";
import { benchmarkValue } from "@/lib/model-utils";

const SORT_KEYS = new Set(["name", "promptPricePerMillion", "completionPricePerMillion", "contextLength", "intelligenceIndex", "codingIndex", "agenticIndex"]);

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const rawLimit = Number(params.get("limit") || 100);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 500) : 100;
  const query = (params.get("q") || "").trim().slice(0, 120).toLowerCase();
  const provider = (params.get("provider") || "").trim().slice(0, 80).toLowerCase();
  const sort = SORT_KEYS.has(params.get("sort")) ? params.get("sort") : "name";
  const direction = params.get("direction") === "asc" ? "asc" : "desc";
  const catalog = await getCatalog();

  let models = catalog.models.filter((model) => {
    const text = `${model.id} ${model.name} ${model.provider} ${model.description} ${(model.inputModalities || []).join(" ")} ${(model.outputModalities || []).join(" ")}`.toLowerCase();
    return (!query || text.includes(query)) && (!provider || model.provider.toLowerCase() === provider);
  });

  if (sort === "name") {
    models = models.sort((a, b) => a.name.localeCompare(b.name) * (direction === "asc" ? 1 : -1));
  } else if (sort === "intelligenceIndex" || sort === "codingIndex" || sort === "agenticIndex") {
    models = models.sort((a, b) => {
      const left = benchmarkValue(a, sort);
      const right = benchmarkValue(b, sort);
      if (left === null) return 1;
      if (right === null) return -1;
      return (left - right) * (direction === "asc" ? 1 : -1);
    });
  } else {
    models = models.sort((a, b) => {
      const left = a[sort];
      const right = b[sort];
      if (left == null) return 1;
      if (right == null) return -1;
      return (Number(left) - Number(right)) * (direction === "asc" ? 1 : -1);
    });
  }

  return Response.json(
    { models: models.slice(0, limit), total: models.length, source: catalog.source, status: catalog.status, stale: catalog.stale, checkedAt: catalog.checkedAt, error: catalog.error },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
