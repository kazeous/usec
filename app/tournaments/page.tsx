import Link from "next/link";
import { ArrowRight, Clock, CalendarX, MapPin } from "lucide-react";
import { GameBadge } from "@/components/GameBadge";
import { SiteHeader } from "@/components/SiteHeader";
import { TournamentStatusPill } from "@/components/TournamentStatusPill";
import { getPublicTournaments } from "@/lib/data";
import { formatTournamentFormat } from "@/lib/game-config";

export const dynamic = "force-dynamic";

export default async function TournamentsPage() {
  const tournaments = await getPublicTournaments();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-4xl font-black">Tournaments</h1>
          <p className="mt-2 muted">Published brackets and match schedules for players and spectators.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {tournaments.map((tournament) => (
            <Link className="panel p-5 transition hover:border-[#335cba]" href={`/tournaments/${tournament.id}`} key={tournament.id}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">{tournament.title}</h2>
                <GameBadge game={tournament.game} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <TournamentStatusPill status={tournament.status} registrationOpen={tournament.registrationOpen} />
                <span className="rounded-full border border-[#cfc6b8] px-2.5 py-1 text-xs font-bold">
                  {formatTournamentFormat(tournament.format)}
                </span>
              </div>
              {(tournament.startsAt || tournament.registrationClosesAt || tournament.venue) ? (
                <div className="mt-3 grid gap-1.5 text-xs">
                  {tournament.startsAt ? (
                    <span className="inline-flex items-center gap-1.5 muted">
                      <Clock size={13} aria-hidden className="shrink-0" />
                      <span><span className="font-bold">Starts:</span> {new Date(tournament.startsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </span>
                  ) : null}
                  {tournament.registrationClosesAt ? (
                    <span className="inline-flex items-center gap-1.5 muted">
                      <CalendarX size={13} aria-hidden className="shrink-0" />
                      <span><span className="font-bold">Reg. closes:</span> {new Date(tournament.registrationClosesAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                    </span>
                  ) : null}
                  {tournament.venue ? (
                    <span className="inline-flex items-center gap-1.5 muted">
                      <MapPin size={13} aria-hidden className="shrink-0" />
                      <span><span className="font-bold">Venue:</span> {tournament.venue}</span>
                    </span>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-5 flex items-center justify-between gap-3 text-sm font-bold">
                <span>{tournament.entries.length} teams</span>
                <span className="inline-flex items-center gap-2">
                  View
                  <ArrowRight size={16} aria-hidden />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
