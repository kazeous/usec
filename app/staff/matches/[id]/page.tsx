import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MatchScoreForm } from "@/components/staff/MatchScoreForm";
import { StaffNav } from "@/components/staff/StaffNav";
import { VetoControl } from "@/components/staff/VetoControl";
import { StatusPill } from "@/components/StatusPill";
import { requireStaff } from "@/lib/auth";
import { getStaffMatch } from "@/lib/data";
import { getGameConfig } from "@/lib/game-config";
import { getNextVetoStep } from "@/lib/tournaments/veto";

export const dynamic = "force-dynamic";

export default async function StaffMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const match = await getStaffMatch(id);
  if (!match) notFound();
  const hasVeto = getGameConfig(match.tournament.game).hasMapVeto;
  const initialVeto = match.vetoSession && match.teamAEntryId && match.teamBEntryId ? {
    status: match.vetoSession.status,
    mapPool: match.vetoSession.mapPool as string[],
    actions: match.vetoSession.actions,
    nextStep: getNextVetoStep({ game: match.vetoSession.game, teamAEntryId: match.teamAEntryId, teamBEntryId: match.teamBEntryId, mapPool: match.vetoSession.mapPool as string[], actions: match.vetoSession.actions })
  } : null;

  return (
    <>
      <StaffNav name={staff.name} role={staff.role} />
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link className="inline-flex items-center gap-2 text-sm font-bold muted" href={`/staff/tournaments/${match.tournamentId}`}><ArrowLeft size={16} aria-hidden />Tournament</Link>
        <section className="panel p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-black uppercase text-cobalt">Round {match.round}, Match {match.position}</p><h1 className="text-3xl font-black">{match.teamA?.name ?? "TBD"} vs {match.teamB?.name ?? "TBD"}</h1></div><StatusPill value={match.status} /></div></section>
        {match.teamA && match.teamB && !match.isBye ? <MatchScoreForm matchId={id} teamAName={match.teamA.name} teamBName={match.teamB.name} bestOf={match.bestOf} initialTeamAScore={match.teamAScore} initialTeamBScore={match.teamBScore} completed={match.status === "complete"} /> : <div className="panel p-5"><p className="font-bold">This match is waiting for both entrants.</p></div>}
        {hasVeto && match.teamA && match.teamB ? <VetoControl matchId={id} teamAName={match.teamA.name} teamBName={match.teamB.name} initial={initialVeto} /> : null}
      </main>
    </>
  );
}
