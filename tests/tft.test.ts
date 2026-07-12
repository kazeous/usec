import { describe, expect, it } from "vitest";
import {
  isTftFieldSize,
  pointsForPlacement,
  rankTftEntries,
  resolveTftFinal,
  snakeLobbyIndex
} from "@/lib/tournaments/tft";

describe("TFT lobby competition", () => {
  it("accepts supported fields and scores placements", () => {
    expect([8, 16, 32, 64].every(isTftFieldSize)).toBe(true);
    expect(isTftFieldSize(24)).toBe(false);
    expect(Array.from({ length: 8 }, (_, index) => pointsForPlacement(index + 1))).toEqual([8, 7, 6, 5, 4, 3, 2, 1]);
  });

  it("assigns snake lobby positions", () => {
    expect(Array.from({ length: 8 }, (_, index) => snakeLobbyIndex(index, 4))).toEqual([0, 1, 2, 3, 3, 2, 1, 0]);
  });

  it("uses points, placement profile, recency, then seed for ties", () => {
    const ranked = rankTftEntries([
      { entryId: "steady", stageSeed: 2, placements: [2, 2] },
      { entryId: "winner", stageSeed: 3, placements: [1, 3] },
      { entryId: "recent", stageSeed: 4, placements: [3, 1] }
    ]);
    expect(ranked.map((row) => row.entryId)).toEqual(["recent", "winner", "steady"]);
  });

  it("resolves a fixed six-game final by ranking", () => {
    const inputs = Array.from({ length: 8 }, (_, index) => ({ entryId: String(index), stageSeed: index + 1, placements: Array(6).fill(index + 1) }));
    expect(resolveTftFinal(inputs, "fixed_games")).toEqual({ complete: true, winnerEntryId: "0" });
  });

  it("requires a later first after reaching checkmate threshold", () => {
    const inputs = Array.from({ length: 8 }, (_, index) => ({
      entryId: String(index),
      stageSeed: index + 1,
      placements: index === 0 ? [1, 1, 4, 1] : [index + 1, index + 1, index + 1, 2]
    }));
    expect(resolveTftFinal(inputs.map((input) => ({ ...input, placements: input.placements.slice(0, 3) })), "checkmate").complete).toBe(false);
    expect(resolveTftFinal(inputs, "checkmate")).toEqual({ complete: true, winnerEntryId: "0" });
  });

  it("falls back to ranking after eight checkmate games", () => {
    const inputs = Array.from({ length: 8 }, (_, index) => ({ entryId: String(index), stageSeed: index + 1, placements: Array(8).fill(index + 1) }));
    expect(resolveTftFinal(inputs, "checkmate")).toEqual({ complete: true, winnerEntryId: "0" });
  });
});
