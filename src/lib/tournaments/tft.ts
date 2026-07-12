import type { TftFinalMode } from "@/lib/types";

export const TFT_FIELD_SIZES = [8, 16, 32, 64] as const;
export const TFT_STAGE_GAMES = 4;
export const TFT_FIXED_FINAL_GAMES = 6;
export const TFT_CHECKMATE_THRESHOLD = 20;
export const TFT_CHECKMATE_MAX_GAMES = 8;

export type TftRankingInput = {
  entryId: string;
  stageSeed: number;
  placements: number[];
};

export type TftRankingRow = TftRankingInput & {
  points: number;
  weightedTopFour: number;
  placementCounts: number[];
  rank: number;
};

export function pointsForPlacement(placement: number) {
  if (!Number.isInteger(placement) || placement < 1 || placement > 8) {
    throw new Error("TFT placement must be an integer from 1 to 8.");
  }
  return 9 - placement;
}

export function isTftFieldSize(size: number): size is (typeof TFT_FIELD_SIZES)[number] {
  return TFT_FIELD_SIZES.includes(size as (typeof TFT_FIELD_SIZES)[number]);
}

export function snakeLobbyIndex(seedIndex: number, lobbyCount: number) {
  if (!Number.isInteger(lobbyCount) || lobbyCount < 1) throw new Error("Lobby count must be positive.");
  if (lobbyCount === 1) return 0;
  const position = seedIndex % (lobbyCount * 2);
  return position < lobbyCount ? position : lobbyCount * 2 - position - 1;
}

export function rankTftEntries(inputs: TftRankingInput[]): TftRankingRow[] {
  const rows = inputs.map((input) => {
    const placementCounts = Array.from({ length: 8 }, (_, index) => input.placements.filter((placement) => placement === index + 1).length);
    const topFour = input.placements.filter((placement) => placement <= 4).length;
    return {
      ...input,
      points: input.placements.reduce((sum, placement) => sum + pointsForPlacement(placement), 0),
      weightedTopFour: placementCounts[0] * 2 + topFour,
      placementCounts,
      rank: 0
    };
  });

  rows.sort((a, b) => {
    if (a.points !== b.points) return b.points - a.points;
    if (a.weightedTopFour !== b.weightedTopFour) return b.weightedTopFour - a.weightedTopFour;
    for (let placement = 0; placement < 8; placement += 1) {
      if (a.placementCounts[placement] !== b.placementCounts[placement]) {
        return b.placementCounts[placement] - a.placementCounts[placement];
      }
    }
    const games = Math.max(a.placements.length, b.placements.length);
    for (let game = games - 1; game >= 0; game -= 1) {
      const aPlacement = a.placements[game] ?? 9;
      const bPlacement = b.placements[game] ?? 9;
      if (aPlacement !== bPlacement) return aPlacement - bPlacement;
    }
    return a.stageSeed - b.stageSeed;
  });

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function resolveTftFinal(inputs: TftRankingInput[], mode: TftFinalMode) {
  const completedGames = Math.min(...inputs.map((input) => input.placements.length));
  if (!Number.isFinite(completedGames) || completedGames === 0) return { complete: false as const, winnerEntryId: null };

  if (mode === "checkmate") {
    for (let game = 0; game < completedGames; game += 1) {
      const winner = inputs.find((input) => {
        const priorPoints = input.placements.slice(0, game).reduce((sum, placement) => sum + pointsForPlacement(placement), 0);
        return priorPoints >= TFT_CHECKMATE_THRESHOLD && input.placements[game] === 1;
      });
      if (winner) return { complete: true as const, winnerEntryId: winner.entryId };
    }
    if (completedGames < TFT_CHECKMATE_MAX_GAMES) return { complete: false as const, winnerEntryId: null };
  } else if (completedGames < TFT_FIXED_FINAL_GAMES) {
    return { complete: false as const, winnerEntryId: null };
  }

  return { complete: true as const, winnerEntryId: rankTftEntries(inputs)[0]?.entryId ?? null };
}
