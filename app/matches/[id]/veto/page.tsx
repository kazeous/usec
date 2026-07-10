import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { VetoViewer } from "@/components/tournament/VetoViewer";
import { getPublicMatch } from "@/lib/data";
import { getGameConfig } from "@/lib/game-config";
import { getNextVetoStep } from "@/lib/tournaments/veto";

export const dynamic = "force-dynamic";

export default async function MatchVetoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getPublicMatch(id);
  if (!match || !getGameConfig(match.tournament.game).hasMapVeto) notFound();
  const session = match.vetoSession;
  const initial = session && match.teamAEntryId && match.teamBEntryId ? {
    status: session.status,
    mapPool: session.mapPool as string[],
    actions: session.actions,
    nextStep: getNextVetoStep({ game: session.game, teamAEntryId: match.teamAEntryId, teamBEntryId: match.teamBEntryId, mapPool: session.mapPool as string[], actions: session.actions }),
    teamA: match.teamA ? { id: match.teamA.id, name: match.teamA.name } : null,
    teamB: match.teamB ? { id: match.teamB.id, name: match.teamB.name } : null
  } : null;
  return <><SiteHeader /><main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"><Link className="mb-6 inline-flex items-center gap-2 text-sm font-bold muted" href={`/matches/${id}`}><ArrowLeft size={16} aria-hidden />Match</Link><VetoViewer matchId={id} initial={initial} /></main></>;
}
