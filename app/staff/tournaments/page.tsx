import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { GameBadge } from "@/components/GameBadge";
import { StaffNav } from "@/components/staff/StaffNav";
import { TournamentCreateForm } from "@/components/staff/TournamentCreateForm";
import { StatusPill } from "@/components/StatusPill";
import { requireStaff } from "@/lib/auth";
import { getPublicTournaments } from "@/lib/data";
import { formatTournamentFormat } from "@/lib/game-config";

export const dynamic = "force-dynamic";

export default async function StaffTournamentsPage() {
  const staff = await requireStaff();
  const tournaments = await getPublicTournaments();

  return (
    <>
      <StaffNav name={staff.name} />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-4xl font-black">Tournaments</h1>
          <p className="mt-2 muted">Create events and generate brackets from approved registrations.</p>
        </div>
        <TournamentCreateForm />
        <section className="grid gap-4 md:grid-cols-2">
          {tournaments.map((tournament) => (
            <Link className="panel p-5 transition hover:border-[#335cba]" href={`/staff/tournaments/${tournament.id}`} key={tournament.id}>
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-black">{tournament.title}</h2>
                <GameBadge game={tournament.game} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill value={tournament.status} />
                <span className="rounded-full border border-[#cfc6b8] px-2.5 py-1 text-xs font-bold">
                  {formatTournamentFormat(tournament.format)}
                </span>
              </div>
              <p className="mt-5 inline-flex items-center gap-2 text-sm font-bold">
                Manage
                <ArrowRight size={16} aria-hidden />
              </p>
            </Link>
          ))}
        </section>
      </main>
    </>
  );
}
