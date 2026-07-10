import type { Match, Prisma, TournamentEntry } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getGameConfig } from "@/lib/game-config";
import type { PublicMatch, TeamSeed } from "@/lib/types";
import {
  calculateStandings,
  defaultSwissRounds,
  generateCompetition,
  generateSwissRound,
  validateTerminalSeriesScore
} from "@/lib/tournaments/brackets";

export class CompetitionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

type Tx = Prisma.TransactionClient;

export async function generateTournamentCompetition(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { entries: { where: { status: "confirmed" }, orderBy: [{ seed: "asc" }, { displayName: "asc" }] } }
  });
  if (!tournament) throw new CompetitionError("Tournament not found.", 404);

  const started = await prisma.match.count({
    where: { tournamentId, status: { in: ["veto", "live", "complete", "disputed"] } }
  });
  if (started > 0) throw new CompetitionError("The bracket cannot be regenerated after a match has started.", 409);
  if (tournament.entries.length < 2) throw new CompetitionError("At least two confirmed entries are required.");
  if (tournament.format === "swiss" && tournament.entries.length < 4) {
    throw new CompetitionError("Swiss tournaments require at least four entries.");
  }

  const participants = tournament.entries.map((entry, index) => ({
    id: entry.id,
    name: entry.displayName,
    seed: entry.seed ?? index + 1
  }));
  const generated = generateCompetition(tournament.format, participants);
  const bestOf = getGameConfig(tournament.game).defaultBestOf;

  await prisma.$transaction(async (tx) => {
    await tx.match.deleteMany({ where: { tournamentId } });
    const ids = new Map<string, string>();
    for (const seed of generated.matches) {
      const match = await tx.match.create({
        data: {
          tournamentId,
          round: seed.round,
          position: seed.position,
          bracket: seed.bracket,
          status: seed.status,
          bestOf,
          teamAEntryId: seed.teamAEntryId,
          teamBEntryId: seed.teamBEntryId,
          winnerEntryId: seed.winnerEntryId,
          isBye: seed.isBye ?? false,
          isResetFinal: seed.isResetFinal ?? false
        }
      });
      ids.set(seed.key, match.id);
    }
    for (const route of generated.feeds) {
      const sourceMatchId = ids.get(route.sourceKey);
      const targetMatchId = ids.get(route.targetKey);
      if (!sourceMatchId || !targetMatchId) throw new CompetitionError("Generated bracket contains an invalid route.", 500);
      await tx.matchFeed.create({ data: { sourceMatchId, targetMatchId, outcome: route.outcome, targetSlot: route.targetSlot } });
    }
    await tx.tournament.update({
      where: { id: tournamentId },
      data: {
        status: "seeded",
        registrationOpen: false,
        lockBracketAt: new Date(),
        currentRound: 1,
        swissRounds: tournament.format === "swiss" ? tournament.swissRounds ?? defaultSwissRounds(participants.length) : null
      }
    });
    await propagateExistingByes(tx, tournamentId);
  });

  return { matches: generated.matches.length };
}

async function assignFeed(tx: Tx, match: Match, outcome: "winner" | "loser", entryId: string | null) {
  if (!entryId) return;
  const route = await tx.matchFeed.findUnique({
    where: { sourceMatchId_outcome: { sourceMatchId: match.id, outcome } },
    include: { targetMatch: true }
  });
  if (!route) return;
  const data = route.targetSlot === "team_a" ? { teamAEntryId: entryId } : { teamBEntryId: entryId };
  await tx.match.update({ where: { id: route.targetMatchId }, data });
}

async function routeCompletedMatch(tx: Tx, match: Match) {
  if (!match.winnerEntryId) return;
  const loserEntryId = match.teamAEntryId === match.winnerEntryId ? match.teamBEntryId : match.teamAEntryId;
  await assignFeed(tx, match, "winner", match.winnerEntryId);
  await assignFeed(tx, match, "loser", loserEntryId);
}

async function propagateExistingByes(tx: Tx, tournamentId: string) {
  const routed = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    const matches = await tx.match.findMany({
      where: { tournamentId },
      include: { feedsIn: { include: { sourceMatch: true } } },
      orderBy: [{ bracket: "asc" }, { round: "asc" }, { position: "asc" }]
    });
    for (const match of matches) {
      if (match.status === "complete" && match.winnerEntryId && !routed.has(match.id)) {
        await routeCompletedMatch(tx, match);
        routed.add(match.id);
        changed = true;
        continue;
      }
      if (match.status !== "pending" || match.isResetFinal) continue;
      const refreshed = await tx.match.findUnique({ where: { id: match.id } });
      if (!refreshed) continue;
      if (refreshed.teamAEntryId && refreshed.teamBEntryId) {
        await tx.match.update({ where: { id: match.id }, data: { status: "scheduled" } });
        changed = true;
        continue;
      }
      const sourcesResolved = match.feedsIn.length > 0 && match.feedsIn.every((item) => item.sourceMatch.status === "complete");
      const onlyEntry = refreshed.teamAEntryId ?? refreshed.teamBEntryId;
      if (sourcesResolved && onlyEntry) {
        await tx.match.update({
          where: { id: match.id },
          data: { status: "complete", isBye: true, winnerEntryId: onlyEntry }
        });
        changed = true;
      }
    }
  }
}

async function clearOldRoutes(tx: Tx, match: Match) {
  const routes = await tx.matchFeed.findMany({ where: { sourceMatchId: match.id }, include: { targetMatch: true } });
  for (const route of routes) {
    if (route.targetMatch.status === "complete" && route.targetMatch.isBye) {
      await resetMatchAndDescendants(tx, route.targetMatchId, new Set());
      continue;
    }
    if (["veto", "live", "complete", "disputed"].includes(route.targetMatch.status)) {
      throw new CompetitionError("A downstream match has already started. Roll it back before correcting this result.", 409);
    }
    const oldEntry = route.outcome === "winner"
      ? match.winnerEntryId
      : match.teamAEntryId === match.winnerEntryId ? match.teamBEntryId : match.teamAEntryId;
    if (!oldEntry) continue;
    const current = route.targetSlot === "team_a" ? route.targetMatch.teamAEntryId : route.targetMatch.teamBEntryId;
    if (current === oldEntry) {
      await tx.match.update({
        where: { id: route.targetMatchId },
        data: route.targetSlot === "team_a" ? { teamAEntryId: null, status: "pending" } : { teamBEntryId: null, status: "pending" }
      });
    }
  }
}

async function resetMatchAndDescendants(tx: Tx, matchId: string, seen: Set<string>) {
  if (seen.has(matchId)) return;
  seen.add(matchId);
  const routes = await tx.matchFeed.findMany({ where: { sourceMatchId: matchId } });
  for (const route of routes) await resetMatchAndDescendants(tx, route.targetMatchId, seen);
  await tx.vetoSession.deleteMany({ where: { matchId } });
  await tx.match.update({
    where: { id: matchId },
    data: {
      teamAEntryId: null,
      teamBEntryId: null,
      winnerEntryId: null,
      teamAScore: 0,
      teamBScore: 0,
      isBye: false,
      status: "pending"
    }
  });
}

export async function rollbackMatchResult(matchId: string) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: matchId }, include: { tournament: true } });
    if (!match) throw new CompetitionError("Match not found.", 404);
    if (match.status !== "complete") throw new CompetitionError("Only a completed result can be rolled back.", 409);
    const routes = await tx.matchFeed.findMany({ where: { sourceMatchId: match.id } });
    for (const route of routes) await resetMatchAndDescendants(tx, route.targetMatchId, new Set());
    if (match.tournament.format === "double_elimination" && match.bracket === "finals" && match.round === 1) {
      const reset = await tx.match.findFirst({ where: { tournamentId: match.tournamentId, isResetFinal: true } });
      if (reset) await resetMatchAndDescendants(tx, reset.id, new Set());
    }
    await tx.vetoSession.deleteMany({ where: { matchId } });
    await tx.match.update({
      where: { id: matchId },
      data: { winnerEntryId: null, teamAScore: 0, teamBScore: 0, status: match.teamAEntryId && match.teamBEntryId ? "scheduled" : "pending" }
    });
    await propagateExistingByes(tx, match.tournamentId);
    const completed = await tx.match.count({ where: { tournamentId: match.tournamentId, status: "complete", isBye: false } });
    await tx.tournament.update({ where: { id: match.tournamentId }, data: { status: completed ? "live" : "seeded" } });
    return { ok: true };
  });
}

export async function recordMatchScore(matchId: string, teamAScore: number, teamBScore: number) {
  return prisma.$transaction(async (tx) => {
    const match = await tx.match.findUnique({ where: { id: matchId }, include: { tournament: true } });
    if (!match) throw new CompetitionError("Match not found.", 404);
    if (!match.teamAEntryId || !match.teamBEntryId) throw new CompetitionError("Both entrants must be assigned before scoring.");
    const validation = validateTerminalSeriesScore(match.bestOf, teamAScore, teamBScore);
    if (!validation.valid) throw new CompetitionError(validation.reason);
    if (match.status === "complete") await clearOldRoutes(tx, match);
    const winnerEntryId = validation.winner === "team_a" ? match.teamAEntryId : match.teamBEntryId;
    const updated = await tx.match.update({
      where: { id: matchId },
      data: { teamAScore, teamBScore, winnerEntryId, status: "complete", isBye: false }
    });
    await routeCompletedMatch(tx, updated);
    await propagateExistingByes(tx, match.tournamentId);
    await updateTournamentAfterScore(tx, updated);
    return { winnerEntryId };
  });
}

async function updateTournamentAfterScore(tx: Tx, match: Match) {
  const tournament = await tx.tournament.findUnique({ where: { id: match.tournamentId } });
  if (!tournament) return;
  if (tournament.format === "double_elimination" && match.bracket === "finals" && match.round === 1) {
    if (match.winnerEntryId === match.teamAEntryId) {
      await tx.tournament.update({ where: { id: tournament.id }, data: { status: "complete" } });
      return;
    }
    const reset = await tx.match.findFirst({ where: { tournamentId: tournament.id, isResetFinal: true } });
    if (reset) {
      await tx.match.update({
        where: { id: reset.id },
        data: { teamAEntryId: match.teamAEntryId, teamBEntryId: match.teamBEntryId, status: "scheduled" }
      });
    }
    await tx.tournament.update({ where: { id: tournament.id }, data: { status: "live" } });
    return;
  }
  if (match.isResetFinal) {
    await tx.tournament.update({ where: { id: tournament.id }, data: { status: "complete" } });
    return;
  }
  const remaining = await tx.match.count({
    where: { tournamentId: tournament.id, isResetFinal: false, status: { not: "complete" } }
  });
  const competitionComplete = remaining === 0 && (tournament.format !== "swiss" || tournament.currentRound >= (tournament.swissRounds ?? 0));
  await tx.tournament.update({ where: { id: tournament.id }, data: { status: competitionComplete ? "complete" : "live" } });
}

export async function generateNextSwissRound(tournamentId: string) {
  return prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { id: tournamentId },
      include: { entries: { where: { status: "confirmed" }, orderBy: [{ seed: "asc" }, { displayName: "asc" }] } }
    });
    if (!tournament) throw new CompetitionError("Tournament not found.", 404);
    if (tournament.format !== "swiss") throw new CompetitionError("Only Swiss tournaments generate rounds incrementally.");
    const configuredRounds = tournament.swissRounds ?? defaultSwissRounds(tournament.entries.length);
    if (tournament.currentRound >= configuredRounds) throw new CompetitionError("All configured Swiss rounds have been generated.", 409);
    const incomplete = await tx.match.count({ where: { tournamentId, round: tournament.currentRound, status: { not: "complete" } } });
    if (incomplete > 0) throw new CompetitionError("Complete the current Swiss round before generating another.", 409);

    const matches = await tx.match.findMany({
      where: { tournamentId },
      include: { teamA: true, teamB: true, winner: true }
    });
    const publicMatches = matches.map(toPublicMatchForStandings);
    const seeds: TeamSeed[] = tournament.entries.map((entry) => ({ id: entry.id, name: entry.displayName, seed: entry.seed }));
    const standings = calculateStandings(seeds, publicMatches, "swiss");
    const opponents = new Map<string, string[]>();
    const byes = new Map<string, number>();
    for (const match of matches.filter((item) => item.status === "complete" && item.teamAEntryId)) {
      if (!match.teamBEntryId) byes.set(match.teamAEntryId!, (byes.get(match.teamAEntryId!) ?? 0) + 1);
      else {
        opponents.set(match.teamAEntryId!, [...(opponents.get(match.teamAEntryId!) ?? []), match.teamBEntryId]);
        opponents.set(match.teamBEntryId, [...(opponents.get(match.teamBEntryId) ?? []), match.teamAEntryId!]);
      }
    }
    const nextRound = tournament.currentRound + 1;
    const generated = generateSwissRound(
      standings.map((row) => ({
        id: row.entryId,
        name: row.name,
        seed: row.seed,
        wins: row.wins,
        gameDifferential: row.gameDifferential,
        opponents: opponents.get(row.entryId) ?? [],
        byes: byes.get(row.entryId) ?? 0
      })),
      nextRound
    );
    for (const match of generated.matches) {
      await tx.match.create({
        data: {
          tournamentId,
          round: match.round,
          position: match.position,
          bracket: "swiss",
          status: match.status,
          bestOf: getGameConfig(tournament.game).defaultBestOf,
          teamAEntryId: match.teamAEntryId,
          teamBEntryId: match.teamBEntryId,
          winnerEntryId: match.winnerEntryId,
          isBye: match.isBye ?? false
        }
      });
    }
    await tx.tournament.update({ where: { id: tournamentId }, data: { currentRound: nextRound, status: "live" } });
    return { round: nextRound, matches: generated.matches.length };
  });
}

function toPublicMatchForStandings(match: Match & { teamA: TournamentEntry | null; teamB: TournamentEntry | null; winner: TournamentEntry | null }): PublicMatch {
  const entry = (value: TournamentEntry | null) => value ? { id: value.id, name: value.displayName, seed: value.seed } : null;
  return {
    id: match.id,
    round: match.round,
    position: match.position,
    bracket: match.bracket,
    status: match.status,
    bestOf: match.bestOf,
    teamA: entry(match.teamA),
    teamB: entry(match.teamB),
    winner: entry(match.winner),
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    isBye: match.isBye,
    isResetFinal: match.isResetFinal
  };
}
