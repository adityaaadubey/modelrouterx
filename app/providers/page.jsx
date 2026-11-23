import Link from "next/link";
import ArenaProviderExplorer from "@/components/arena-provider-explorer";
import { getArenaSnapshot } from "@/lib/arena-data";

export const metadata = {
  title: "Providers",
  description: "See how source-listed AI labs and companies are represented across Arena leaderboards.",
};

export default async function ProvidersPage() {
  const data = await getArenaSnapshot();
  return <ArenaProviderExplorer {...data} />;
}
