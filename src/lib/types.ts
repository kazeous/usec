export const games = ["valorant", "cs2", "lol"] as const;
export type Game = (typeof games)[number];

export const tournamentFormats = [
  "single_elimination",
  "double_elimination",
  "round_robin",
  "swiss"
] as const;
export type TournamentFormat = (typeof tournamentFormats)[number];

export const registrationModes = ["solo", "team"] as const;
export type RegistrationMode = (typeof registrationModes)[number];

export type RegistrationStatus = "pending" | "approved" | "rejected";
export type MatchStatus = "pending" | "scheduled" | "veto" | "live" | "complete" | "disputed";
export type BracketSide = "winners" | "losers" | "finals" | "round_robin" | "swiss";

export type TeamSeed = {
  id: string;
  name: string;
  seed?: number | null;
};

export type BracketMatchSeed = {
  round: number;
  position: number;
  bracket: BracketSide;
  teamAId?: string | null;
  teamBId?: string | null;
  status: MatchStatus;
  winnerId?: string | null;
  winnerToRound?: number | null;
  winnerToPosition?: number | null;
};

export type PublicTeam = {
  id: string;
  name: string;
  seed?: number | null;
};

export type PublicMatch = {
  id: string;
  round: number;
  position: number;
  bracket: BracketSide;
  status: MatchStatus;
  bestOf: number;
  teamA?: PublicTeam | null;
  teamB?: PublicTeam | null;
  winner?: PublicTeam | null;
  teamAScore: number;
  teamBScore: number;
};

export type PublicTournament = {
  id: string;
  title: string;
  game: Game;
  format: TournamentFormat;
  status: string;
  registrationOpen: boolean;
  matches: PublicMatch[];
  teams: PublicTeam[];
};

export type TeammateInput = {
  fullName: string;
  studentId: string;
  universityName: string;
  email: string;
  discord?: string;
};
