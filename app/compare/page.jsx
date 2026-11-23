import ArenaCompareWorkbench from "@/components/arena-compare-workbench";
import { getArenaSnapshot } from "@/lib/arena-data";

export const metadata = {
  title: "Compare",
  description: "Compare any two models using source-published scores from the same Arena leaderboard track.",
};

export default async function ComparePage() {
  const data = await getArenaSnapshot();
  return <ArenaCompareWorkbench {...data} />;
}
