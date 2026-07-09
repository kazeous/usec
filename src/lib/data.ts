import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { sampleRegistrationSettings, sampleTournaments } from "@/lib/sample-data";
import type { VetoActionType } from "@/lib/tournaments/veto";
import type { Game, PublicMatch, PublicTournament } from "@/lib/types";

type TournamentWithRelations = Prisma.TournamentGetPayload<{
  include: {
    teams: true;
    matches: {
      include: {
        teamA: true;
        teamB: true;
        winner: true;
      };
    };
  };
}>;

type MatchWithDetails = Prisma.MatchGetPayload<{
  include: {
    tournament: true;
    teamA: true;
    teamB: true;
    winner: true;
    vetoSession: {
      include: {
        actions: true;
      };
    };
  };
}>;

export type AppMatchDetail = PublicMatch & {
  tournamentId?: string;
  tournament?: {
    id: string;
    title: string;
    game: Game;
  } | null;
  teamAId?: string | null;
  teamBId?: string | null;
  vetoSession?: {
    status: string;
    game: Game;
    mapPool: unknown;
    actions: Array<{
      action: VetoActionType;
      mapName: string;
      order: number;
      actorTeamId?: string | null;
    }>;
  } | null;
};

type RegistrationSettingView = {
  game: Game;
  isOpen: boolean;
  message?: string | null;
};

function toPublicMatch(match: TournamentWithRelations["matches"][number]): PublicMatch {
  return {
    id: match.id,
    round: match.round,
    position: match.position,
    bracket: match.bracket,
    status: match.status,
    bestOf: match.bestOf,
    teamA: match.teamA,
    teamB: match.teamB,
    winner: match.winner,
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore
  };
}

function toPublicTournament(tournament: TournamentWithRelations): PublicTournament {
  return {
    id: tournament.id,
    title: tournament.title,
    game: tournament.game,
    format: tournament.format,
    status: tournament.status,
    registrationOpen: tournament.registrationOpen,
    teams: tournament.teams ?? [],
    matches: (tournament.matches ?? []).map(toPublicMatch)
  };
}

function toMatchDetail(match: MatchWithDetails): AppMatchDetail {
  return {
    id: match.id,
    round: match.round,
    position: match.position,
    bracket: match.bracket,
    status: match.status,
    bestOf: match.bestOf,
    teamA: match.teamA,
    teamB: match.teamB,
    winner: match.winner,
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    tournamentId: match.tournamentId,
    tournament: match.tournament,
    teamAId: match.teamAId,
    teamBId: match.teamBId,
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

function toSampleMatchDetail(id: string): AppMatchDetail | null {
  const tournament = sampleTournaments.find((item) => item.matches.some((match) => match.id === id));
  const match = tournament?.matches.find((item) => item.id === id);

  if (!tournament || !match) {
    return null;
  }

  return {
    ...match,
    tournamentId: tournament.id,
    tournament: {
      id: tournament.id,
      title: tournament.title,
      game: tournament.game
    },
    teamAId: match.teamA?.id ?? null,
    teamBId: match.teamB?.id ?? null,
    vetoSession: null
  };
}

export async function getPublicTournaments() {
  try {
    const tournaments = await prisma.tournament.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        teams: true,
        matches: {
          include: {
            teamA: true,
            teamB: true,
            winner: true
          },
          orderBy: [{ bracket: "asc" }, { round: "asc" }, { position: "asc" }]
        }
      }
    });

    return tournaments.map(toPublicTournament);
  } catch {
    return sampleTournaments;
  }
}

export async function getPublicTournament(id: string) {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        teams: true,
        matches: {
          include: {
            teamA: true,
            teamB: true,
            winner: true
          },
          orderBy: [{ bracket: "asc" }, { round: "asc" }, { position: "asc" }]
        }
      }
    });

    return tournament ? toPublicTournament(tournament) : sampleTournaments.find((item) => item.id === id) ?? null;
  } catch {
    return sampleTournaments.find((item) => item.id === id) ?? null;
  }
}

export async function getPublicMatch(id: string) {
  try {
    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournament: true,
        teamA: true,
        teamB: true,
        winner: true,
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

    return match ? toMatchDetail(match) : toSampleMatchDetail(id);
  } catch {
    return toSampleMatchDetail(id);
  }
}

export async function getRegistrationSettings(): Promise<RegistrationSettingView[]> {
  try {
    return await prisma.registrationSetting.findMany({
      orderBy: {
        game: "asc"
      }
    });
  } catch {
    return sampleRegistrationSettings.map((setting) => ({ ...setting }));
  }
}

export async function getStaffStats() {
  try {
    const [registrations, pending, tournaments, liveMatches] = await Promise.all([
      prisma.registration.count(),
      prisma.registration.count({ where: { status: "pending" } }),
      prisma.tournament.count(),
      prisma.match.count({ where: { status: { in: ["scheduled", "veto", "live"] } } })
    ]);

    return { registrations, pending, tournaments, liveMatches };
  } catch {
    return { registrations: 0, pending: 0, tournaments: sampleTournaments.length, liveMatches: 2 };
  }
}
