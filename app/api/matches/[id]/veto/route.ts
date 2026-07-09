import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getNextVetoStep } from "@/lib/tournaments/veto";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      vetoSession: {
        include: {
          actions: {
            orderBy: {
              order: "asc"
            }
          }
        }
      }
    }
  });

  if (!match?.vetoSession) {
    return NextResponse.json({ error: "Veto session not found." }, { status: 404 });
  }

  return NextResponse.json({
    status: match.vetoSession.status,
    mapPool: match.vetoSession.mapPool,
    actions: match.vetoSession.actions,
    nextStep:
      match.teamAId && match.teamBId
        ? getNextVetoStep({
            game: match.vetoSession.game,
            teamAId: match.teamAId,
            teamBId: match.teamBId,
            mapPool: match.vetoSession.mapPool as string[],
            actions: match.vetoSession.actions
          })
        : null
  });
}
