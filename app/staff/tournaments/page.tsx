import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GameBadge } from "@/components/GameBadge";
import { StaffNav } from "@/components/staff/StaffNav";
import { TournamentCreateForm } from "@/components/staff/TournamentCreateForm";
import { TournamentStatusPill } from "@/components/TournamentStatusPill";
import { requireStaff } from "@/lib/auth";
import { getStaffTournaments } from "@/lib/data";
import { formatTournamentFormat } from "@/lib/game-config";

export const dynamic = "force-dynamic";

export default async function StaffTournamentsPage() {
  const staff = await requireStaff();
  const tournaments = await getStaffTournaments();

  return (
    <>
      <StaffNav name={staff.name} role={staff.role} />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-4xl font-black">Tournaments</h1>
          <p className="mt-2 muted">{staff.role === "admin" ? "Create events and generate brackets from approved registrations." : "Open tournament brackets and match-day tools."}</p>
        </div>
        <div className={`grid items-start gap-6 ${staff.role === "admin" ? "lg:grid-cols-[minmax(0,1fr)_25rem]" : ""}`}>
          {staff.role === "admin" ? <aside className="lg:col-start-2 lg:row-start-1 lg:sticky lg:top-6"><TournamentCreateForm /></aside> : null}
          <section className={staff.role === "admin" ? "lg:col-start-1 lg:row-start-1" : ""}>
            <div className="mb-4 flex items-end justify-between gap-4">
              <div><h2 className="text-2xl font-black">All tournaments</h2><p className="mt-1 text-sm muted">Open an event to manage entrants, competition, and match-day operations.</p></div>
              <span className="rounded-full border border-[#cfc6b8] bg-[#fffdf8] px-3 py-1 text-sm font-bold">{tournaments.length} total</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {tournaments.map((tournament) => (
                <Link className="panel flex min-h-44 flex-col p-5 transition hover:border-[#335cba]" href={`/staff/tournaments/${tournament.id}`} key={tournament.id}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-xl font-black">{tournament.title}</h3>
                    <GameBadge game={tournament.game} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <TournamentStatusPill status={tournament.status} registrationOpen={tournament.registrationOpen} />
                    <span className="rounded-full border border-[#cfc6b8] px-2.5 py-1 text-xs font-bold">
                      {formatTournamentFormat(tournament.format)}
                    </span>
                  </div>
                  <p className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold">
                    Manage
                    <ArrowRight size={16} aria-hidden />
                  </p>
                </Link>
              ))}
            </div>
            {!tournaments.length ? <div className="panel p-6 text-sm muted">No tournaments have been created yet.</div> : null}
          </section>
        </div>
      </main>
    </>
  );
}
