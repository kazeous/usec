export const games = ["valorant", "cs2", "lol"] as const;
export type Game = (typeof games)[number];

export const tournamentFormats = ["single_elimination", "double_elimination", "round_robin", "swiss"] as const;
export type TournamentFormat = (typeof tournamentFormats)[number];
export const tournamentStatuses = ["draft", "registration", "seeded", "live", "complete", "archived"] as const;
export type TournamentStatus = (typeof tournamentStatuses)[number];

export const registrationModes = ["solo", "team"] as const;
export type RegistrationMode = (typeof registrationModes)[number];
export type RegistrationStatus = "pending" | "approved" | "rejected";
export type MatchStatus = "pending" | "scheduled" | "veto" | "live" | "complete" | "disputed";
export type BracketSide = "winners" | "losers" | "finals" | "round_robin" | "swiss";
export type MatchOutcome = "winner" | "loser";
export type MatchSlot = "team_a" | "team_b";

export type TeamSeed = { id: string; name: string; seed?: number | null };

export type BracketMatchSeed = {
  key: string;
  round: number;
  position: number;
  bracket: BracketSide;
  teamAEntryId?: string | null;
  teamBEntryId?: string | null;
  status: MatchStatus;
  winnerEntryId?: string | null;
  isBye?: boolean;
  isResetFinal?: boolean;
};

export type BracketFeedSeed = {
  sourceKey: string;
  outcome: MatchOutcome;
  targetKey: string;
  targetSlot: MatchSlot;
};

export type GeneratedCompetition = { matches: BracketMatchSeed[]; feeds: BracketFeedSeed[] };

export type PublicEntry = { id: string; name: string; seed?: number | null };

export type PublicMatch = {
  id: string;
  round: number;
  position: number;
  bracket: BracketSide;
  status: MatchStatus;
  bestOf: number;
  teamA?: PublicEntry | null;
  teamB?: PublicEntry | null;
  winner?: PublicEntry | null;
  teamAScore: number;
  teamBScore: number;
  isBye?: boolean;
  isResetFinal?: boolean;
};

export type StandingRow = {
  entryId: string;
  name: string;
  seed: number | null;
  played: number;
  wins: number;
  losses: number;
  gamesWon: number;
  gamesLost: number;
  gameDifferential: number;
  buchholz?: number;
  rank: number;
};

export type PublicTournament = {
  id: string;
  title: string;
  game: Game;
  format: TournamentFormat;
  status: TournamentStatus;
  registrationOpen: boolean;
  registrationMessage?: string | null;
  registrationClosesAt?: string | null;
  startsAt?: string | null;
  swissRounds?: number | null;
  currentRound: number;
  matches: PublicMatch[];
  entries: PublicEntry[];
  standings: StandingRow[];
};

export type RegistrationMemberInput = {
  fullName: string;
  inGameName: string;
  studentId: string;
  universityName: string;
  email?: string;
  discord?: string;
  isCaptain?: boolean;
};

export type TeammateInput = Omit<RegistrationMemberInput, "isCaptain">;
