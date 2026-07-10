import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BracketView } from "@/components/tournament/BracketView";
import { StandingsTable } from "@/components/tournament/StandingsTable";
import { TournamentOperations } from "@/components/staff/TournamentOperations";
import { StaffNav } from "@/components/staff/StaffNav";
import { requireStaff } from "@/lib/auth";
import { getStaffTournament } from "@/lib/data";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StaffTournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const tournament = await getStaffTournament(id);
  if (!tournament) notFound();
  const [teams, solos] = await Promise.all([
    prisma.team.findMany({ where: { game: tournament.game }, select: { id: true, name: true, game: true }, orderBy: { name: "asc" } }),
    prisma.registration.findMany({
      where: { tournamentId: id, mode: "solo", status: "approved", resolvedTeamId: null },
      include: { members: true },
      orderBy: { createdAt: "asc" }
    })
  ]);
  return <><StaffNav name={staff.name} /><main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8"><Link className="inline-flex items-center gap-2 text-sm font-bold muted" href="/staff/tournaments"><ArrowLeft size={16} aria-hidden />Tournaments</Link><div><h1 className="text-4xl font-black">{tournament.title}</h1><p className="mt-2 muted">Manage registration, entrants, seeds, competition, scores, and standings.</p></div><TournamentOperations tournament={tournament} entries={tournament.entries} teams={teams} solos={solos.map((registration) => ({ id: registration.id, name: registration.members[0]?.fullName ?? "Solo player" }))} /><StandingsTable standings={tournament.standings} swiss={tournament.format === "swiss"} /><BracketView matches={tournament.matches} staff /></main></>;
}
