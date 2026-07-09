import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGameConfig } from "@/lib/game-config";
import { generateBracket } from "@/lib/tournaments/brackets";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id }
  });

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found." }, { status: 404 });
  }

  await prisma.team.updateMany({
    where: {
      game: tournament.game,
      tournamentId: null
    },
    data: {
      tournamentId: tournament.id
    }
  });

  const teams = await prisma.team.findMany({
    where: {
      tournamentId: tournament.id
    },
    orderBy: [{ seed: "asc" }, { name: "asc" }]
  });

  if (teams.length < 2) {
    return NextResponse.json({ error: "At least two approved teams are required." }, { status: 400 });
  }

  const seeds = teams.map((team, index) => ({
    id: team.id,
    name: team.name,
    seed: team.seed ?? index + 1
  }));
  const generated = generateBracket(tournament.format, seeds);
  const bestOf = getGameConfig(tournament.game).defaultBestOf;

  await prisma.$transaction([
    prisma.match.deleteMany({
      where: {
        tournamentId: tournament.id
      }
    }),
    prisma.match.createMany({
      data: generated.map((match) => ({
        tournamentId: tournament.id,
        round: match.round,
        position: match.position,
        bracket: match.bracket,
        status: match.status,
        teamAId: match.teamAId ?? undefined,
        teamBId: match.teamBId ?? undefined,
        winnerId: match.winnerId ?? undefined,
        bestOf
      }))
    }),
    prisma.tournament.update({
      where: {
        id: tournament.id
      },
      data: {
        status: "seeded"
      }
    })
  ]);

  return NextResponse.json({ matches: generated.length });
}
