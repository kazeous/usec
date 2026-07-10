import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateStandings } from "@/lib/tournaments/brackets";
import type { VetoActionType } from "@/lib/tournaments/veto";
import type { Game, PublicEntry, PublicMatch, PublicTournament, TeamSeed } from "@/lib/types";

const tournamentInclude = {
  entries: { where: { status: "confirmed" as const }, orderBy: [{ seed: "asc" as const }, { displayName: "asc" as const }] },
  matches: {
    include: { teamA: true, teamB: true, winner: true },
    orderBy: [{ bracket: "asc" as const }, { round: "asc" as const }, { position: "asc" as const }]
  }
};

type TournamentWithRelations = Prisma.TournamentGetPayload<{ include: typeof tournamentInclude }>;
type MatchWithDetails = Prisma.MatchGetPayload<{
  include: { tournament: true; teamA: true; teamB: true; winner: true; vetoSession: { include: { actions: true } } };
}>;

export type AppMatchDetail = PublicMatch & {
  tournamentId: string;
  tournament: { id: string; title: string; game: Game; format: string };
  teamAEntryId?: string | null;
  teamBEntryId?: string | null;
  vetoSession?: {
    status: string;
    game: Game;
    mapPool: unknown;
    actions: Array<{ action: VetoActionType; mapName: string; order: number; actorEntryId?: string | null }>;
  } | null;
};

function toEntry(entry: { id: string; displayName: string; seed: number | null }): PublicEntry {
  return { id: entry.id, name: entry.displayName, seed: entry.seed };
}

function toPublicMatch(match: TournamentWithRelations["matches"][number]): PublicMatch {
  return {
    id: match.id,
    round: match.round,
    position: match.position,
    bracket: match.bracket,
    status: match.status,
    bestOf: match.bestOf,
    teamA: match.teamA ? toEntry(match.teamA) : null,
    teamB: match.teamB ? toEntry(match.teamB) : null,
    winner: match.winner ? toEntry(match.winner) : null,
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    isBye: match.isBye,
    isResetFinal: match.isResetFinal
  };
}

function toPublicTournament(tournament: TournamentWithRelations): PublicTournament {
  const entries = tournament.entries.map(toEntry);
  const matches = tournament.matches.map(toPublicMatch);
  const standings = tournament.format === "round_robin" || tournament.format === "swiss"
    ? calculateStandings(entries as TeamSeed[], matches, tournament.format)
    : [];
  return {
    id: tournament.id,
    title: tournament.title,
    game: tournament.game,
    format: tournament.format,
    status: tournament.status,
    registrationOpen: tournament.registrationOpen && (!tournament.registrationClosesAt || tournament.registrationClosesAt > new Date()),
    registrationMessage: tournament.registrationMessage,
    registrationClosesAt: tournament.registrationClosesAt?.toISOString() ?? null,
    startsAt: tournament.startsAt?.toISOString() ?? null,
    swissRounds: tournament.swissRounds,
    currentRound: tournament.currentRound,
    entries,
    matches,
    standings
  };
}

export async function getPublicTournaments() {
  const tournaments = await prisma.tournament.findMany({
    where: { status: { not: "draft" } },
    orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }],
    include: tournamentInclude
  });
  return tournaments.map(toPublicTournament);
}

export async function getStaffTournaments() {
  const tournaments = await prisma.tournament.findMany({ orderBy: { createdAt: "desc" }, include: tournamentInclude });
  return tournaments.map(toPublicTournament);
}

export async function getOpenRegistrationTournaments() {
  const now = new Date();
  const tournaments = await prisma.tournament.findMany({
    where: { status: "registration", registrationOpen: true, OR: [{ registrationClosesAt: null }, { registrationClosesAt: { gt: now } }] },
    orderBy: [{ startsAt: "asc" }, { title: "asc" }],
    include: tournamentInclude
  });
  return tournaments.map(toPublicTournament);
}

export async function getPublicTournament(id: string) {
  const tournament = await prisma.tournament.findFirst({
    where: { id, status: { not: "draft" } },
    include: tournamentInclude
  });
  return tournament ? toPublicTournament(tournament) : null;
}

export async function getStaffTournament(id: string) {
  const tournament = await prisma.tournament.findUnique({ where: { id }, include: tournamentInclude });
  return tournament ? toPublicTournament(tournament) : null;
}

export async function getPublicMatch(id: string): Promise<AppMatchDetail | null> {
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: true,
      teamA: true,
      teamB: true,
      winner: true,
      vetoSession: { include: { actions: { orderBy: { order: "asc" } } } }
    }
  });
  if (!match || match.tournament.status === "draft") return null;
  return toMatchDetail(match);
}

export async function getStaffMatch(id: string): Promise<AppMatchDetail | null> {
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      tournament: true,
      teamA: true,
      teamB: true,
      winner: true,
      vetoSession: { include: { actions: { orderBy: { order: "asc" } } } }
    }
  });
  return match ? toMatchDetail(match) : null;
}

function toMatchDetail(match: MatchWithDetails): AppMatchDetail {
  return {
    id: match.id,
    round: match.round,
    position: match.position,
    bracket: match.bracket,
    status: match.status,
    bestOf: match.bestOf,
    teamA: match.teamA ? toEntry(match.teamA) : null,
    teamB: match.teamB ? toEntry(match.teamB) : null,
    winner: match.winner ? toEntry(match.winner) : null,
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    isBye: match.isBye,
    isResetFinal: match.isResetFinal,
    tournamentId: match.tournamentId,
    tournament: { id: match.tournament.id, title: match.tournament.title, game: match.tournament.game, format: match.tournament.format },
    teamAEntryId: match.teamAEntryId,
    teamBEntryId: match.teamBEntryId,
    vetoSession: match.vetoSession
      ? {
          status: match.vetoSession.status,
          game: match.vetoSession.game,
          mapPool: match.vetoSession.mapPool,
          actions: match.vetoSession.actions
        }
      : null
  };
}

export async function getStaffStats() {
  const [registrations, pending, tournaments, liveMatches] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({ where: { status: "pending" } }),
    prisma.tournament.count(),
    prisma.match.count({ where: { status: { in: ["scheduled", "veto", "live"] } } })
  ]);
  return { registrations, pending, tournaments, liveMatches };
}
