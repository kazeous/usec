import type { Game, ParticipationFormat } from "@/lib/types";

export type GameConfig = {
  label: string;
  shortLabel: string;
  teamSize: number;
  maxReservePlayers: number;
  hasMapVeto: boolean;
  defaultBestOf: number;
  defaultMapPool: string[];
  futureFeatures: string[];
  officialImage: string;
};

export const gameConfigs: Record<Game, GameConfig> = {
  valorant: {
    label: "Valorant",
    shortLabel: "VAL",
    teamSize: 5,
    maxReservePlayers: 2,
    hasMapVeto: true,
    defaultBestOf: 3,
    defaultMapPool: ["Ascent", "Bind", "Haven", "Icebox", "Lotus", "Split", "Sunset"],
    futureFeatures: [],
    officialImage: "/images/games/valorant.png"
  },
  cs2: {
    label: "Counter-Strike 2",
    shortLabel: "CS2",
    teamSize: 5,
    maxReservePlayers: 2,
    hasMapVeto: true,
    defaultBestOf: 3,
    defaultMapPool: ["Ancient", "Anubis", "Dust II", "Inferno", "Mirage", "Nuke", "Vertigo"],
    futureFeatures: [],
    officialImage: "/images/games/cs2.jpg"
  },
  lol: {
    label: "League of Legends",
    shortLabel: "LoL",
    teamSize: 5,
    maxReservePlayers: 2,
    hasMapVeto: false,
    defaultBestOf: 1,
    defaultMapPool: [],
    futureFeatures: ["Champion draft flow", "Side selection", "Pick/ban analytics"],
    officialImage: "/images/games/lol.svg"
  },
  tft: {
    label: "Teamfight Tactics",
    shortLabel: "TFT",
    teamSize: 1,
    maxReservePlayers: 0,
    hasMapVeto: false,
    defaultBestOf: 1,
    defaultMapPool: [],
    futureFeatures: [],
    officialImage: "/images/games/tft.svg"
  }
};

export function getGameConfig(game: Game) {
  return gameConfigs[game];
}

export function formatParticipationFormat(format: ParticipationFormat) {
  if (format === "five_v_five") return "5v5";
  if (format === "one_v_one") return "1v1";
  return "TFT";
}

export function getTournamentRosterRules(game: Game, format: ParticipationFormat) {
  const individual = format === "one_v_one" || format === "tft";
  return {
    mainRosterSize: individual ? 1 : gameConfigs[game].teamSize,
    maxReservePlayers: individual ? 0 : gameConfigs[game].maxReservePlayers,
    individual
  };
}

export function formatGame(game: Game) {
  return gameConfigs[game].label;
}

export function formatTournamentFormat(format: string) {
  if (format === "tft_lobby") return "TFT Lobby";
  return format
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
