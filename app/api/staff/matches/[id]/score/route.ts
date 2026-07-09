import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";

const scoreSchema = z.object({
  teamAScore: z.number().int().min(0),
  teamBScore: z.number().int().min(0)
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const payload = scoreSchema.parse(await request.json());

  if (payload.teamAScore === payload.teamBScore) {
    return NextResponse.json({ error: "Scores cannot tie for bracket advancement." }, { status: 400 });
  }

  const match = await prisma.match.findUnique({
    where: { id }
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found." }, { status: 404 });
  }

  const winnerId = payload.teamAScore > payload.teamBScore ? match.teamAId : match.teamBId;
  if (!winnerId) {
    return NextResponse.json({ error: "Winner team is missing." }, { status: 400 });
  }

  const nextPosition = Math.ceil(match.position / 2);
  const nextRound = match.round + 1;

  await prisma.$transaction(async (tx) => {
    await tx.match.update({
      where: { id },
      data: {
        ...payload,
        winnerId,
        status: "complete"
      }
    });

    const nextMatch = await tx.match.findFirst({
      where: {
        tournamentId: match.tournamentId,
        bracket: match.bracket,
        round: nextRound,
        position: nextPosition
      }
    });

    if (nextMatch) {
      await tx.match.update({
        where: { id: nextMatch.id },
        data: nextMatch.teamAId
          ? {
              teamBId: winnerId,
              status: nextMatch.teamBId ? nextMatch.status : "scheduled"
            }
          : {
              teamAId: winnerId,
              status: nextMatch.teamBId ? "scheduled" : nextMatch.status
            }
      });
    }
  });

  return NextResponse.json({ winnerId });
}
