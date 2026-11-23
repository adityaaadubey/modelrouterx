import ArenaOverview from "@/components/arena-overview";
import { getArenaSnapshot } from "@/lib/arena-data";

export default async function HomePage() {
  const data = await getArenaSnapshot();
  return <ArenaOverview {...data} />;
}
