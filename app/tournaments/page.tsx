import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock, CalendarX, MapPin, Monitor } from "lucide-react";
import { GameBadge } from "@/components/GameBadge";
import { SiteHeader } from "@/components/SiteHeader";
import { TournamentStatusPill } from "@/components/TournamentStatusPill";
import { getPublicTournaments } from "@/lib/data";
import { formatParticipationFormat, formatTournamentFormat, gameConfigs } from "@/lib/game-config";

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
        <div className="grid gap-5 lg:grid-cols-2">
          {tournaments.map((tournament) => (
            <Link className="panel group min-h-64 overflow-hidden transition hover:border-[#335cba]" href={`/tournaments/${tournament.id}`} key={tournament.id}>
              <div className="grid h-full sm:grid-cols-[minmax(0,1fr)_9.5rem]">
                <div className="flex min-w-0 flex-col p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-black">{tournament.title}</h2>
                    <GameBadge game={tournament.game} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <TournamentStatusPill status={tournament.status} registrationOpen={tournament.registrationOpen} />
                    <span className="rounded-full border border-[#cfc6b8] px-2.5 py-1 text-xs font-bold">{formatParticipationFormat(tournament.participationFormat)}</span>
                    <span className="rounded-full border border-[#cfc6b8] px-2.5 py-1 text-xs font-bold">{formatTournamentFormat(tournament.format)}</span>
                  </div>
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
                  <span className="inline-flex items-center gap-1.5 muted">
                    {tournament.locationMode === "online" ? <Monitor size={13} aria-hidden className="shrink-0" /> : <MapPin size={13} aria-hidden className="shrink-0" />}
                    <span><span className="font-bold">Place:</span> {tournament.locationMode === "online" ? "Online" : "Offline"}{tournament.venue ? ` · ${tournament.venue}` : ""}</span>
                  </span>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm font-bold">
                    <span>{tournament.entries.length} {tournament.participationFormat === "five_v_five" ? "teams" : "players"}</span>
                    <span className="inline-flex items-center gap-2">View<ArrowRight className="transition-transform group-hover:translate-x-1" size={16} aria-hidden /></span>
                  </div>
                </div>
                <div className={`relative hidden min-h-64 overflow-hidden sm:block ${tournament.game === "valorant" ? "bg-[#ff4655]" : tournament.game === "cs2" ? "bg-[#e48717]" : tournament.game === "lol" ? "bg-[#c99b3b]" : "bg-[#17253d]"}`}>
                  {tournament.game === "cs2" ? <Image className="object-cover object-[62%_center] transition duration-300 group-hover:scale-105" src={gameConfigs[tournament.game].officialImage} alt="Counter-Strike 2 official artwork" fill sizes="152px" /> : <div className="absolute inset-4 flex items-center justify-center"><Image className="h-auto max-h-32 w-full object-contain transition duration-300 group-hover:scale-105" src={gameConfigs[tournament.game].officialImage} alt={`${gameConfigs[tournament.game].label} official logo`} width={368} height={160} /></div>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
