import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getGameConfig } from "@/lib/game-config";
import { apiErrorResponse, ApiError, requireStaffApi } from "@/lib/http";
import { applyVetoAction, completeSystemDecider, getNextVetoStep, isVetoComplete } from "@/lib/tournaments/veto";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffApi(request);
    const { id } = await params;
    const match = await prisma.match.findUnique({
      where: { id },
      include: { tournament: true, vetoSession: { include: { actions: true } } }
    });
    if (!match?.teamAEntryId || !match.teamBEntryId) throw new ApiError("Both entrants must be assigned before veto starts.");
    if (["complete", "disputed"].includes(match.status)) throw new ApiError("A completed or disputed match cannot start veto.", 409);
    const config = getGameConfig(match.tournament.game);
    if (!config.hasMapVeto) throw new ApiError("This game does not use map veto.");
    if (match.vetoSession?.actions.length) {
      if (match.vetoSession.status === "active" || match.vetoSession.status === "complete") return NextResponse.json(match.vetoSession);
      throw new ApiError("A veto with recorded actions cannot be restarted.", 409);
    }
    const session = await prisma.$transaction(async (tx) => {
      const result = await tx.vetoSession.upsert({
        where: { matchId: match.id },
        update: { status: "active" },
        create: { matchId: match.id, game: match.tournament.game, status: "active", mapPool: config.defaultMapPool }
      });
      await tx.match.update({ where: { id: match.id }, data: { status: "veto" } });
      return result;
    });
    return NextResponse.json(session);
  } catch (error) { return apiErrorResponse(error); }
}

const actionSchema = z.object({ mapName: z.string().min(1) });

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireStaffApi(request);
    const { id } = await params;
    const { mapName } = actionSchema.parse(await request.json());
    const result = await prisma.$transaction(async (tx) => {
      const match = await tx.match.findUnique({
        where: { id },
        include: { vetoSession: { include: { actions: { orderBy: { order: "asc" } } } } }
      });
      if (!match?.teamAEntryId || !match.teamBEntryId || !match.vetoSession) throw new ApiError("Active veto session not found.", 404);
      if (match.vetoSession.status !== "active") throw new ApiError("The veto session is not active.", 409);
      const baseState = {
        game: match.vetoSession.game,
        teamAEntryId: match.teamAEntryId,
        teamBEntryId: match.teamBEntryId,
        mapPool: match.vetoSession.mapPool as string[],
        actions: match.vetoSession.actions
      };
      const step = getNextVetoStep(baseState);
      const actorEntryId = step?.team === "A" ? match.teamAEntryId : step?.team === "B" ? match.teamBEntryId : null;
      let nextState = applyVetoAction(baseState, mapName, actorEntryId);
      nextState = completeSystemDecider(nextState);
      const created = nextState.actions.slice(match.vetoSession.actions.length);
      for (const action of created) {
        await tx.vetoAction.create({
          data: {
            sessionId: match.vetoSession.id,
            actorEntryId: action.actorEntryId,
            action: action.action,
            mapName: action.mapName,
            order: action.order
          }
        });
      }
      const complete = isVetoComplete(nextState);
      await tx.vetoSession.update({ where: { id: match.vetoSession.id }, data: { status: complete ? "complete" : "active" } });
      if (complete) await tx.match.update({ where: { id: match.id }, data: { status: "scheduled" } });
      return { status: complete ? "complete" : "active", nextStep: getNextVetoStep(nextState) };
    }, { isolationLevel: "Serializable" });
    return NextResponse.json(result);
  } catch (error) { return apiErrorResponse(error); }
}
