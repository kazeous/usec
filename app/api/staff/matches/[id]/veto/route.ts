import { NextResponse } from "next/server";
import { requireStaff } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getGameConfig } from "@/lib/game-config";
import { applyVetoAction, completeSystemDecider, getNextVetoStep, isVetoComplete } from "@/lib/tournaments/veto";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: true
    }
  });

  if (!match?.teamAId || !match.teamBId) {
    return NextResponse.json({ error: "Both teams must be assigned before veto starts." }, { status: 400 });
  }

  const config = getGameConfig(match.tournament.game);
  if (!config.hasMapVeto) {
    return NextResponse.json({ error: "This game does not use map veto in v1." }, { status: 400 });
  }

  const session = await prisma.vetoSession.upsert({
    where: {
      matchId: match.id
    },
    update: {
      status: "active"
    },
    create: {
      matchId: match.id,
      game: match.tournament.game,
      status: "active",
      mapPool: config.defaultMapPool
    }
  });

  await prisma.match.update({
    where: {
      id: match.id
    },
    data: {
      status: "veto"
    }
  });

  return NextResponse.json(session);
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const mapName = String(body?.mapName ?? "");
  const actorTeamId = body?.actorTeamId ? String(body.actorTeamId) : null;

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

  if (!match?.teamAId || !match.teamBId || !match.vetoSession) {
    return NextResponse.json({ error: "Active veto session not found." }, { status: 404 });
  }

  try {
    const baseState = {
      game: match.vetoSession.game,
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      mapPool: match.vetoSession.mapPool as string[],
      actions: match.vetoSession.actions
    };
    let nextState = applyVetoAction(baseState, mapName, actorTeamId);
    nextState = completeSystemDecider(nextState);
    const createdActions = nextState.actions.slice(match.vetoSession.actions.length);
    const complete = isVetoComplete(nextState);

    await prisma.$transaction([
      ...createdActions.map((action) =>
        prisma.vetoAction.create({
          data: {
            sessionId: match.vetoSession!.id,
            actorTeamId: action.actorTeamId,
            action: action.action,
            mapName: action.mapName,
            order: action.order
          }
        })
      ),
      prisma.vetoSession.update({
        where: {
          id: match.vetoSession.id
        },
        data: {
          status: complete ? "complete" : "active"
        }
      })
    ]);

    return NextResponse.json({
      status: complete ? "complete" : "active",
      nextStep: getNextVetoStep(nextState)
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid veto action." }, { status: 400 });
  }
}
