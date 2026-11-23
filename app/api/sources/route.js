import { getSourceHealth } from "@/lib/platform-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await getSourceHealth();
  return Response.json(
    { available: result.available, sources: result.sources, checkedAt: result.checkedAt, error: result.error },
    {
      status: result.available ? 200 : 503,
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    },
  );
}
