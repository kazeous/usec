import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { BracketView } from "@/components/tournament/BracketView";
import { BracketActions } from "@/components/staff/BracketActions";
import { StaffNav } from "@/components/staff/StaffNav";
import { requireStaff } from "@/lib/auth";
import { getPublicTournament } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function StaffTournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await requireStaff();
  const { id } = await params;
  const tournament = await getPublicTournament(id);

  if (!tournament) {
    notFound();
  }

  return (
    <>
      <StaffNav name={staff.name} />
      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Link className="inline-flex items-center gap-2 text-sm font-bold muted" href="/staff/tournaments">
          <ArrowLeft size={16} aria-hidden />
          Tournaments
        </Link>
        <div>
          <h1 className="text-4xl font-black">{tournament.title}</h1>
          <p className="mt-2 muted">Generate and manage the public bracket.</p>
        </div>
        <BracketActions tournamentId={tournament.id} />
        <BracketView matches={tournament.matches} />
      </main>
    </>
  );
}
