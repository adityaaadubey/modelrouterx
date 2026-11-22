import { getHistorySnapshots, getHuggingFaceSnapshots } from "@/lib/platform-data";

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const rawModelId = params.get("model")?.trim().slice(0, 200);
  const source = params.get("source") === "huggingface" ? "huggingface" : "catalog";
  const rawLimit = Number(params.get("limit") || 100);
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.floor(rawLimit), 1), 1000) : 100;
  const result = source === "huggingface"
    ? await getHuggingFaceSnapshots({ modelId: rawModelId, limit })
    : await getHistorySnapshots({ modelId: rawModelId, limit });

  return Response.json(
    { snapshots: result.rows, total: result.rows.length, available: result.available, error: result.error },
    { status: result.available ? 200 : 503, headers: { "Cache-Control": "private, no-store" } },
  );
}
