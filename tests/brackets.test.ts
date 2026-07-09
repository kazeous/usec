import { describe, expect, it } from "vitest";
import {
  generateDoubleElimination,
  generateRoundRobin,
  generateSingleElimination,
  generateSwissRound
} from "@/lib/tournaments/brackets";

const teams = [
  { id: "a", name: "Alpha", seed: 1 },
  { id: "b", name: "Beta", seed: 2 },
  { id: "c", name: "Charlie", seed: 3 },
  { id: "d", name: "Delta", seed: 4 }
];

describe("bracket generation", () => {
  it("creates a single elimination bracket with final", () => {
    const matches = generateSingleElimination(teams);

    expect(matches).toHaveLength(3);
    expect(matches.filter((match) => match.round === 1)).toHaveLength(2);
    expect(matches.find((match) => match.round === 2)?.position).toBe(1);
  });

  it("creates winners, losers, and finals matches for double elimination", () => {
    const matches = generateDoubleElimination(teams);

    expect(matches.some((match) => match.bracket === "winners")).toBe(true);
    expect(matches.some((match) => match.bracket === "losers")).toBe(true);
    expect(matches.some((match) => match.bracket === "finals")).toBe(true);
  });

  it("creates all round robin pairings once", () => {
    const matches = generateRoundRobin(teams);
    const pairKeys = new Set(matches.map((match) => [match.teamAId, match.teamBId].sort().join(":")));

    expect(matches).toHaveLength(6);
    expect(pairKeys.size).toBe(6);
  });

  it("avoids rematches in Swiss pairings when possible", () => {
    const matches = generateSwissRound(
      [
        { ...teams[0], points: 3, opponents: ["b"] },
        { ...teams[1], points: 3, opponents: ["a"] },
        { ...teams[2], points: 0, opponents: [] },
        { ...teams[3], points: 0, opponents: [] }
      ],
      2
    );

    expect(matches[0].teamAId).toBe("a");
    expect(matches[0].teamBId).toBe("c");
  });
});
