import { describe, expect, it } from "vitest";
import {
  calculateStandings,
  defaultSwissRounds,
  generateDoubleElimination,
  generateRoundRobin,
  generateSingleElimination,
  generateSwissRound,
  validateTerminalSeriesScore
} from "@/lib/tournaments/brackets";
import type { PublicMatch, TeamSeed } from "@/lib/types";

const teams: TeamSeed[] = [
  { id: "a", name: "Alpha", seed: 1 },
  { id: "b", name: "Beta", seed: 2 },
  { id: "c", name: "Charlie", seed: 3 },
  { id: "d", name: "Delta", seed: 4 }
];

describe("elimination generation", () => {
  it.each([2, 3, 5, 8, 16])("creates a complete single-elimination graph for %i entries", (count) => {
    const participants = Array.from({ length: count }, (_, index) => ({ id: `t${index}`, name: `Team ${index}`, seed: index + 1 }));
    const generated = generateSingleElimination(participants);
    expect(generated.matches).toHaveLength(2 ** Math.ceil(Math.log2(count)) - 1);
    expect(generated.feeds).toHaveLength(generated.matches.length - 1);
    expect(generated.matches.filter((match) => match.isBye)).toHaveLength(2 ** Math.ceil(Math.log2(count)) - count);
  });

  it("builds winners, losers, grand final, and conditional reset routes", () => {
    const generated = generateDoubleElimination(teams);
    expect(generated.matches.some((match) => match.bracket === "losers")).toBe(true);
    expect(generated.matches.filter((match) => match.bracket === "finals")).toHaveLength(2);
    expect(generated.matches.find((match) => match.isResetFinal)?.status).toBe("pending");
    expect(new Set(generated.feeds.map((route) => `${route.targetKey}:${route.targetSlot}`)).size).toBe(generated.feeds.length);
  });

  it("supports a two-entry double-elimination final without a phantom lower match", () => {
    const generated = generateDoubleElimination(teams.slice(0, 2));
    expect(generated.matches.filter((match) => match.bracket === "losers")).toHaveLength(0);
    expect(generated.feeds.filter((route) => route.targetKey === "finals:1:1")).toHaveLength(2);
  });
});

describe("league formats", () => {
  it("creates each round-robin pairing once", () => {
    const matches = generateRoundRobin(teams).matches;
    const pairs = new Set(matches.map((match) => [match.teamAEntryId, match.teamBEntryId].sort().join(":")));
    expect(matches).toHaveLength(6);
    expect(pairs.size).toBe(6);
  });

  it("avoids Swiss rematches and assigns the lowest eligible bye", () => {
    const generated = generateSwissRound([
      { ...teams[0], wins: 2, gameDifferential: 3, opponents: ["b"], byes: 0 },
      { ...teams[1], wins: 2, gameDifferential: 2, opponents: ["a"], byes: 0 },
      { ...teams[2], wins: 1, gameDifferential: 0, opponents: [], byes: 1 },
      { ...teams[3], wins: 0, gameDifferential: -3, opponents: [], byes: 0 },
      { id: "e", name: "Echo", seed: 5, wins: 0, gameDifferential: -4, opponents: [], byes: 0 }
    ], 3);
    const bye = generated.matches.find((match) => match.isBye);
    expect(bye?.teamAEntryId).toBe("e");
    const alpha = generated.matches.find((match) => match.teamAEntryId === "a");
    expect(alpha?.teamBEntryId).not.toBe("b");
  });

  it("uses field-size Swiss defaults", () => {
    expect(defaultSwissRounds(4)).toBe(3);
    expect(defaultSwissRounds(16)).toBe(4);
    expect(defaultSwissRounds(256)).toBe(7);
  });
});

describe("scoring and standings", () => {
  it("only accepts terminal series scores", () => {
    expect(validateTerminalSeriesScore(3, 2, 1).valid).toBe(true);
    expect(validateTerminalSeriesScore(3, 1, 0).valid).toBe(false);
    expect(validateTerminalSeriesScore(3, 2, 2).valid).toBe(false);
  });

  it("calculates Swiss wins, Buchholz, and game differential", () => {
    const entry = (team: TeamSeed) => ({ id: team.id, name: team.name, seed: team.seed });
    const match = (id: string, a: TeamSeed, b: TeamSeed, aScore: number, bScore: number): PublicMatch => ({
      id, round: 1, position: 1, bracket: "swiss", status: "complete", bestOf: 3,
      teamA: entry(a), teamB: entry(b), winner: entry(aScore > bScore ? a : b), teamAScore: aScore, teamBScore: bScore
    });
    const standings = calculateStandings(teams, [match("1", teams[0], teams[1], 2, 0), match("2", teams[2], teams[3], 2, 1)], "swiss");
    expect(standings[0].wins).toBe(1);
    expect(standings.find((row) => row.entryId === "a")?.gameDifferential).toBe(2);
    expect(standings.every((row) => typeof row.buchholz === "number")).toBe(true);
  });
});
