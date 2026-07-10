import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { apiErrorResponse, ApiError } from "@/lib/http";
import { getNextVetoStep } from "@/lib/tournaments/veto";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: { teamA: true, teamB: true, vetoSession: { include: { actions: { orderBy: { order: "asc" } } } } }
    });
    if (!match?.vetoSession) throw new ApiError("Veto session not found.", 404);
    const state = match.teamAEntryId && match.teamBEntryId ? {
      game: match.vetoSession.game,
      teamAEntryId: match.teamAEntryId,
      teamBEntryId: match.teamBEntryId,
      mapPool: match.vetoSession.mapPool as string[],
      actions: match.vetoSession.actions
    } : null;
    return NextResponse.json({
      status: match.vetoSession.status,
      mapPool: match.vetoSession.mapPool,
      actions: match.vetoSession.actions,
      nextStep: state ? getNextVetoStep(state) : null,
      teamA: match.teamA ? { id: match.teamA.id, name: match.teamA.displayName } : null,
      teamB: match.teamB ? { id: match.teamB.id, name: match.teamB.displayName } : null
    });
  } catch (error) { return apiErrorResponse(error); }
}
