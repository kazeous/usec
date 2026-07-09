import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BracketView } from "@/components/tournament/BracketView";
import { GameBadge } from "@/components/GameBadge";
import { SiteHeader } from "@/components/SiteHeader";
import { StatusPill } from "@/components/StatusPill";
import { getPublicTournament } from "@/lib/data";
import { formatTournamentFormat } from "@/lib/game-config";

export const dynamic = "force-dynamic";

export default async function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tournament = await getPublicTournament(id);

  if (!tournament) {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link className="mb-6 inline-flex items-center gap-2 text-sm font-bold muted" href="/tournaments">
          <ArrowLeft size={16} aria-hidden />
          Tournaments
        </Link>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <GameBadge game={tournament.game} />
              <StatusPill value={tournament.status} />
              <span className="rounded-full border border-[#cfc6b8] px-2.5 py-1 text-xs font-bold">
                {formatTournamentFormat(tournament.format)}
              </span>
            </div>
            <h1 className="text-4xl font-black">{tournament.title}</h1>
          </div>
          <Link className="button button-secondary" href="/register">
            Register
          </Link>
        </div>
        <BracketView matches={tournament.matches} />
      </main>
    </>
  );
}
