import ArenaModelExplorer from "@/components/arena-model-explorer";
import { getArenaSnapshot } from "@/lib/arena-data";

export const metadata = {
  title: "Models",
  description: "Browse and flip through model cards built from the current Arena leaderboard snapshot.",
};

export default async function ModelsPage() {
  const data = await getArenaSnapshot();
  return <ArenaModelExplorer {...data} />;
}
