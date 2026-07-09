import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MatchScoreForm } from "@/components/staff/MatchScoreForm";
import { StaffNav } from "@/components/staff/StaffNav";
import { VetoControl } from "@/components/staff/VetoControl";
import { StatusPill } from "@/components/StatusPill";
import { requireStaff } from "@/lib/auth";
import { getPublicMatch } from "@/lib/data";
import { getGameConfig } from "@/lib/game-config";

export const dynamic = "force-dynamic";

export default async function StaffMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const match = await getPublicMatch(id);

  if (!match) {
    notFound();
  }

  const game = match.tournament?.game ?? "valorant";
  const mapPool = getGameConfig(game).defaultMapPool;

  return (
    <>
      <StaffNav name={staff.name} />
      <main className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link className="inline-flex items-center gap-2 text-sm font-bold muted" href="/staff/tournaments">
          <ArrowLeft size={16} aria-hidden />
          Tournaments
        </Link>
        <section className="panel p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-black uppercase text-cobalt">Round {match.round}, Match {match.position}</p>
              <h1 className="text-3xl font-black">
                {match.teamA?.name ?? "TBD"} vs {match.teamB?.name ?? "TBD"}
              </h1>
            </div>
            <StatusPill value={match.status} />
          </div>
        </section>
        <MatchScoreForm matchId={id} teamAName={match.teamA?.name ?? "Team A"} teamBName={match.teamB?.name ?? "Team B"} />
        {mapPool.length > 0 ? <VetoControl matchId={id} mapPool={mapPool} /> : null}
      </main>
    </>
  );
}
