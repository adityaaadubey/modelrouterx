import { timingSafeEqual } from "node:crypto";
import { runIngestion } from "@/lib/ingestion";

export const dynamic = "force-dynamic";

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const expected = Buffer.from(secret);
  const received = Buffer.from(token);
  return expected.length === received.length && timingSafeEqual(expected, received);
}

async function handle(request) {
  if (!process.env.CRON_SECRET) {
    return Response.json({ error: "Cron ingestion is not enabled. Configure CRON_SECRET in the Vercel project environment." }, { status: 503 });
  }
  if (!authorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const result = await runIngestion();
    return Response.json({ ok: true, ...result });
  } catch {
    return Response.json({ error: "Ingestion did not complete. Check the server-side source and database logs." }, { status: 502 });
  }
}

export async function GET(request) {
  return handle(request);
}

export async function POST(request) {
  return handle(request);
}
