import type { Game } from "@/lib/types";

export type GameConfig = {
  label: string;
  shortLabel: string;
  teamSize: number;
  maxReservePlayers: number;
  hasMapVeto: boolean;
  defaultBestOf: number;
  defaultMapPool: string[];
  futureFeatures: string[];
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
    futureFeatures: []
  },
  cs2: {
    label: "Counter-Strike 2",
    shortLabel: "CS2",
    teamSize: 5,
    maxReservePlayers: 2,
    hasMapVeto: true,
    defaultBestOf: 3,
    defaultMapPool: ["Ancient", "Anubis", "Dust II", "Inferno", "Mirage", "Nuke", "Vertigo"],
    futureFeatures: []
  },
  lol: {
    label: "League of Legends",
    shortLabel: "LoL",
    teamSize: 5,
    maxReservePlayers: 2,
    hasMapVeto: false,
    defaultBestOf: 1,
    defaultMapPool: [],
    futureFeatures: ["Champion draft flow", "Side selection", "Pick/ban analytics"]
  }
};

export function getGameConfig(game: Game) {
  return gameConfigs[game];
}

export function formatGame(game: Game) {
  return gameConfigs[game].label;
}

export function formatTournamentFormat(format: string) {
  return format
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
