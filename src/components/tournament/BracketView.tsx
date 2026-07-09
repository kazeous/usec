import Link from "next/link";
import { Trophy } from "lucide-react";
import { StatusPill } from "@/components/StatusPill";
import type { PublicMatch } from "@/lib/types";

export function BracketView({ matches }: { matches: PublicMatch[] }) {
  const groups = Object.entries(
    matches.reduce<Record<string, PublicMatch[]>>((accumulator, match) => {
      const key = `${match.bracket.replaceAll("_", " ")} round ${match.round}`;
      accumulator[key] = [...(accumulator[key] ?? []), match];
      return accumulator;
    }, {})
  );

  if (groups.length === 0) {
    return (
      <div className="panel p-5">
        <p className="font-bold">No bracket has been generated yet.</p>
        <p className="text-sm muted">Staff can generate one after registrations are approved.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {groups.map(([group, groupMatches]) => (
        <section className="panel p-4" key={group}>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-black capitalize">
            <Trophy size={18} aria-hidden />
            {group}
          </h2>
          <div className="grid gap-3">
            {groupMatches.map((match) => (
              <Link className="rounded-md border border-[#ded7ca] bg-[#fffdf8] p-3 transition hover:border-[#335cba]" href={`/matches/${match.id}`} key={match.id}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-black">Match {match.position}</span>
                  <StatusPill value={match.status} />
                </div>
                <TeamLine name={match.teamA?.name ?? "TBD"} score={match.teamAScore} winner={match.winner?.id === match.teamA?.id} />
                <TeamLine name={match.teamB?.name ?? "TBD"} score={match.teamBScore} winner={match.winner?.id === match.teamB?.id} />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TeamLine({ name, score, winner }: { name: string; score: number; winner: boolean }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3 border-t border-[#ece3d7] py-2">
      <span className={winner ? "font-black" : "font-semibold"}>{name}</span>
      <span className="grid size-8 place-items-center rounded-md bg-[#f0ebe3] font-black">{score}</span>
    </div>
  );
}
