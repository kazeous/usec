import { Prisma, type TftFinalMode } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  isTftFieldSize,
  pointsForPlacement,
  rankTftEntries,
  resolveTftFinal,
  snakeLobbyIndex,
  TFT_CHECKMATE_MAX_GAMES,
  TFT_FIXED_FINAL_GAMES,
  TFT_STAGE_GAMES,
  type TftRankingInput
} from "@/lib/tournaments/tft";

export class TftCompetitionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

type Tx = Prisma.TransactionClient;

const stageInclude = Prisma.validator<Prisma.TftStageInclude>()({
  tournament: true,
  lobbies: {
    orderBy: { number: "asc" },
    include: {
      entries: { orderBy: { stageSeed: "asc" }, include: { entry: true } },
      games: { orderBy: { number: "asc" }, include: { results: true } }
    }
  }
});

type StageWithDetails = Prisma.TftStageGetPayload<{ include: typeof stageInclude }>;

function rankingInputs(stage: StageWithDetails, entryIds?: Set<string>): TftRankingInput[] {
  return stage.lobbies.flatMap((lobby) => lobby.entries)
    .filter((seat) => !entryIds || entryIds.has(seat.entryId))
    .map((seat) => ({
      entryId: seat.entryId,
      stageSeed: seat.stageSeed,
      placements: stage.lobbies
        .find((lobby) => lobby.id === seat.lobbyId)!
        .games.filter((game) => game.completedAt)
        .map((game) => game.results.find((result) => result.entryId === seat.entryId)?.placement)
        .filter((placement): placement is number => placement !== undefined)
    }));
}

async function createStage(
  tx: Tx,
  tournamentId: string,
  sequence: number,
  seededEntryIds: string[],
  finalMode: TftFinalMode
) {
  const lobbyCount = seededEntryIds.length / 8;
  const isFinal = seededEntryIds.length === 8;
  const gameLimit = isFinal
    ? finalMode === "checkmate" ? TFT_CHECKMATE_MAX_GAMES : TFT_FIXED_FINAL_GAMES
    : TFT_STAGE_GAMES;
  const stage = await tx.tftStage.create({
    data: { tournamentId, sequence, isFinal, gameLimit, status: "active" }
  });
  const lobbies = [];
  for (let number = 1; number <= lobbyCount; number += 1) {
    lobbies.push(await tx.tftLobby.create({
      data: {
        stageId: stage.id,
        number,
        games: { create: Array.from({ length: gameLimit }, (_, index) => ({ number: index + 1 })) }
      }
    }));
  }
  for (let index = 0; index < seededEntryIds.length; index += 1) {
    await tx.tftStageEntry.create({
      data: {
        stageId: stage.id,
        lobbyId: lobbies[snakeLobbyIndex(index, lobbyCount)].id,
        entryId: seededEntryIds[index],
        stageSeed: index + 1
      }
    });
  }
  return stage;
}

export async function generateTftCompetition(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { entries: { where: { status: "confirmed" }, orderBy: [{ seed: "asc" }, { displayName: "asc" }] }, tftStages: true }
  });
  if (!tournament) throw new TftCompetitionError("Tournament not found.", 404);
  if (tournament.game !== "tft" || tournament.format !== "tft_lobby") {
    throw new TftCompetitionError("Only TFT lobby tournaments can generate TFT stages.");
  }
  if (!isTftFieldSize(tournament.entries.length)) {
    throw new TftCompetitionError("TFT tournaments require exactly 8, 16, 32, or 64 confirmed players.");
  }
  const started = await prisma.tftGameResult.count({ where: { game: { lobby: { stage: { tournamentId } } } } });
  if (started) throw new TftCompetitionError("TFT lobbies cannot be regenerated after a result is recorded.", 409);

  const finalMode = tournament.tftFinalMode ?? "fixed_games";
  await prisma.$transaction(async (tx) => {
    await tx.tftStage.deleteMany({ where: { tournamentId } });
    await createStage(tx, tournamentId, 1, tournament.entries.map((entry) => entry.id), finalMode);
    await tx.tournament.update({
      where: { id: tournamentId },
      data: { status: "seeded", registrationOpen: false, lockBracketAt: new Date(), currentRound: 1, tftFinalMode: finalMode }
    });
  });
  return { stages: 1, players: tournament.entries.length };
}

async function refreshStage(tx: Tx, stageId: string) {
  const stage = await tx.tftStage.findUnique({ where: { id: stageId }, include: stageInclude });
  if (!stage) throw new TftCompetitionError("TFT stage not found.", 404);

  if (stage.isFinal) {
    const resolution = resolveTftFinal(rankingInputs(stage), stage.tournament.tftFinalMode ?? "fixed_games");
    await tx.tftStage.update({
      where: { id: stage.id },
      data: { status: resolution.complete ? "complete" : "active", winnerEntryId: resolution.winnerEntryId }
    });
    await tx.tournament.update({
      where: { id: stage.tournamentId },
      data: { status: resolution.complete ? "complete" : "live" }
    });
    return;
  }

  const complete = stage.lobbies.every((lobby) => lobby.games.length === stage.gameLimit && lobby.games.every((game) => game.completedAt));
  if (!complete) {
    await tx.tftStage.update({ where: { id: stage.id }, data: { status: "active" } });
    return;
  }
  for (const lobby of stage.lobbies) {
    const ids = new Set(lobby.entries.map((seat) => seat.entryId));
    const qualified = new Set(rankTftEntries(rankingInputs(stage, ids)).slice(0, 4).map((row) => row.entryId));
    for (const seat of lobby.entries) {
      await tx.tftStageEntry.update({ where: { id: seat.id }, data: { advanced: qualified.has(seat.entryId) } });
    }
  }
  await tx.tftStage.update({ where: { id: stage.id }, data: { status: "complete" } });
}

export async function recordTftGameResults(gameId: string, placements: Array<{ entryId: string; placement: number }>) {
  return prisma.$transaction(async (tx) => {
    const game = await tx.tftGame.findUnique({
      where: { id: gameId },
      include: { lobby: { include: { entries: true, stage: { include: { tournament: true } } } } }
    });
    if (!game) throw new TftCompetitionError("TFT game not found.", 404);
    const assigned = new Set(game.lobby.entries.map((seat) => seat.entryId));
    const submittedEntries = new Set(placements.map((item) => item.entryId));
    const submittedPlacements = new Set(placements.map((item) => item.placement));
    if (placements.length !== 8 || submittedEntries.size !== 8 || submittedPlacements.size !== 8 ||
      placements.some((item) => !assigned.has(item.entryId) || item.placement < 1 || item.placement > 8 || !Number.isInteger(item.placement))) {
      throw new TftCompetitionError("Submit each assigned player exactly once with unique placements from 1 to 8.");
    }

    const downstream = await tx.tftStage.findFirst({
      where: { tournamentId: game.lobby.stage.tournamentId, sequence: { gt: game.lobby.stage.sequence } },
      include: { lobbies: { include: { games: { include: { results: true } } } } },
      orderBy: { sequence: "asc" }
    });
    if (downstream) {
      const downstreamStarted = downstream.lobbies.some((lobby) => lobby.games.some((item) => item.results.length));
      if (downstreamStarted) throw new TftCompetitionError("Results cannot change after a downstream stage has started.", 409);
      await tx.tftStage.deleteMany({ where: { tournamentId: game.lobby.stage.tournamentId, sequence: { gt: game.lobby.stage.sequence } } });
      await tx.tftStageEntry.updateMany({ where: { stageId: game.lobby.stageId }, data: { advanced: null } });
    }

    await tx.tftGameResult.deleteMany({ where: { gameId } });
    await tx.tftGameResult.createMany({
      data: placements.map((item) => ({ gameId, entryId: item.entryId, placement: item.placement, points: pointsForPlacement(item.placement) }))
    });
    await tx.tftGame.update({ where: { id: gameId }, data: { completedAt: new Date() } });
    if (["seeded", "complete"].includes(game.lobby.stage.tournament.status)) {
      await tx.tournament.update({ where: { id: game.lobby.stage.tournamentId }, data: { status: "live" } });
    }
    await refreshStage(tx, game.lobby.stageId);
    return { saved: 8 };
  });
}

export async function generateNextTftStage(tournamentId: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.tftStage.findFirst({ where: { tournamentId }, orderBy: { sequence: "desc" }, include: stageInclude });
    if (!current) throw new TftCompetitionError("Generate the first TFT stage before advancing.", 409);
    if (current.isFinal) throw new TftCompetitionError("The final stage has no successor.", 409);
    if (current.status !== "complete") throw new TftCompetitionError("Complete every lobby game before generating the next stage.", 409);
    const qualifiers = current.lobbies.flatMap((lobby) => lobby.entries).filter((seat) => seat.advanced);
    const qualifierIds = new Set(qualifiers.map((seat) => seat.entryId));
    const seededEntryIds = rankTftEntries(rankingInputs(current, qualifierIds)).map((row) => row.entryId);
    if (!isTftFieldSize(seededEntryIds.length)) throw new TftCompetitionError("The advancing field is not a supported TFT size.", 500);
    const stage = await createStage(tx, tournamentId, current.sequence + 1, seededEntryIds, current.tournament.tftFinalMode ?? "fixed_games");
    await tx.tournament.update({ where: { id: tournamentId }, data: { currentRound: current.sequence + 1, status: "live" } });
    return { stageId: stage.id, sequence: current.sequence + 1, players: seededEntryIds.length };
  });
}
