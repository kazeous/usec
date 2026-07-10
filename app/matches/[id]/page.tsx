import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Map } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusPill } from "@/components/StatusPill";
import { getPublicMatch } from "@/lib/data";
import { getGameConfig } from "@/lib/game-config";

export const dynamic = "force-dynamic";

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await getPublicMatch(id);

  if (!match) {
    notFound();
  }
  const hasVeto = getGameConfig(match.tournament.game).hasMapVeto;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-bold muted" href="/tournaments">
          <ArrowLeft size={16} aria-hidden />
          Tournaments
        </Link>
        <section className="panel p-5">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase text-cobalt">Round {match.round}, Match {match.position}</p>
              <h1 className="text-3xl font-black">Match details</h1>
            </div>
            <StatusPill value={match.status} />
          </div>
          <ScoreLine name={match.teamA?.name ?? "TBD"} score={match.teamAScore ?? 0} winner={match.winner?.id === match.teamA?.id} />
          <ScoreLine name={match.teamB?.name ?? "TBD"} score={match.teamBScore ?? 0} winner={match.winner?.id === match.teamB?.id} />
          <div className="mt-6 flex flex-wrap gap-3">
            {hasVeto ? <Link className="button button-primary" href={`/matches/${match.id}/veto`}>
              <Map size={16} aria-hidden />
              Map veto
            </Link> : null}
            <Link className="button button-secondary" href={`/staff/matches/${match.id}`}>
              Staff manage
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

function ScoreLine({ name, score, winner }: { name: string; score: number; winner: boolean }) {
  return (
    <div className="flex min-h-16 items-center justify-between border-t border-[#ded7ca] py-4">
      <p className={winner ? "text-xl font-black" : "text-xl font-bold"}>{name}</p>
      <p className="grid size-12 place-items-center rounded-md bg-[#151515] text-xl font-black text-white">{score}</p>
    </div>
  );
}
