import { getTrendingModels } from "@/lib/platform-data";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const requestedLimit = Number(params.get("limit") || 50);
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(Math.floor(requestedLimit), 1), 100) : 50;
  const result = await getTrendingModels(limit);

  return Response.json(
    { models: result.models, total: result.total, source: result.source, status: result.status, stale: result.stale, checkedAt: result.checkedAt, error: result.error },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
