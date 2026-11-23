import ArenaLeaderboardPage from "@/components/arena-leaderboard-page";
import { getArenaSnapshot } from "@/lib/arena-data";

export const metadata = {
  title: "Leaderboards",
  description: "Explore all source-published Arena rankings across text, vision, agents, search, and media tracks.",
};

export default async function LeaderboardPage() {
  const data = await getArenaSnapshot();
  return <ArenaLeaderboardPage {...data} />;
}
