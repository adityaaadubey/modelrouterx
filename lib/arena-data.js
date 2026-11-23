import "server-only";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

const SNAPSHOT_COLUMNS = "id,source,source_url,published_at,status,row_count,config_count,started_at,completed_at";
const ROW_COLUMNS = "snapshot_id,source_key,model_name,organization,license,source_config,category,rank,rating,rating_lower,rating_upper,variance,vote_count,published_at,source_url,raw";
const PAGE_SIZE = 1000;

export async function getArenaSnapshot() {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { snapshot: null, rows: [], error: "Supabase server credentials are not configured." };
  }

  try {
    const { data: snapshot, error: snapshotError } = await supabase
      .from("arena_leaderboard_snapshots")
      .select(SNAPSHOT_COLUMNS)
      .eq("status", "complete")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (snapshotError) {
      return { snapshot: null, rows: [], error: "The Arena leaderboard snapshot could not be loaded." };
    }
    if (!snapshot) {
      return { snapshot: null, rows: [], error: null };
    }

    const rows = [];
    const expectedRows = Math.max(0, Number(snapshot.row_count) || 0);
    for (let offset = 0; offset < expectedRows; offset += PAGE_SIZE) {
      const { data, error } = await supabase
        .from("arena_leaderboard_rows")
        .select(ROW_COLUMNS)
        .eq("snapshot_id", snapshot.id)
        .order("source_config", { ascending: true })
        .order("rank", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) {
        return { snapshot, rows: [], error: "Ranked model records could not be loaded." };
      }
      if (!data?.length) break;
      rows.push(...data);
    }

    return { snapshot, rows, error: null };
  } catch {
    return { snapshot: null, rows: [], error: "The Arena leaderboard is temporarily unavailable." };
  }
}
