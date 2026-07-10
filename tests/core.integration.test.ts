import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { assembleSoloTeam, enrollExistingTeam } from "@/lib/registrations/service";
import { generateNextSwissRound, generateTournamentCompetition, recordMatchScore, rollbackMatchResult } from "@/lib/tournaments/service";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDatabaseTests).sequential("database-backed core workflow", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tournamentId = `integration-main-${suffix}`;
  const reuseTournamentId = `integration-reuse-${suffix}`;
  const doubleTournamentId = `integration-double-${suffix}`;
  const swissTournamentId = `integration-swiss-${suffix}`;
  const registrationIds: string[] = [];
  const createdTeamIds: string[] = [];

  beforeAll(async () => {
    await prisma.tournament.create({ data: { id: tournamentId, title: "Integration Cup", game: "valorant", format: "single_elimination", status: "registration", registrationOpen: true } });
    await prisma.tournament.create({ data: { id: reuseTournamentId, title: "Reuse Cup", game: "valorant", format: "round_robin", status: "draft" } });
    await prisma.tournament.create({ data: { id: doubleTournamentId, title: "Double Cup", game: "cs2", format: "double_elimination", status: "draft" } });
    await prisma.tournament.create({ data: { id: swissTournamentId, title: "Swiss Cup", game: "valorant", format: "swiss", status: "draft", swissRounds: 3 } });
    for (let index = 0; index < 5; index += 1) {
      const registration = await prisma.registration.create({
        data: {
          tournamentId,
          game: "valorant",
          mode: "solo",
          status: "approved",
          members: { create: { fullName: `Solo ${index}`, studentId: `INT-SOLO-${suffix}-${index}`, universityName: "Integration University", email: `solo-${suffix}-${index}@example.edu`, isCaptain: true } }
        }
      });
      registrationIds.push(registration.id);
    }
  });

  afterAll(async () => {
    await prisma.tournament.deleteMany({ where: { id: { in: [tournamentId, reuseTournamentId, doubleTournamentId, swissTournamentId] } } });
    await prisma.team.deleteMany({ where: { id: { in: createdTeamIds } } });
  });

  it("assembles five approved solos and reuses the team in another event", async () => {
    const assembled = await assembleSoloTeam({ tournamentId, registrationIds, teamName: "Integration Solos" });
    createdTeamIds.push(assembled.teamId);
    const entry = await prisma.tournamentEntry.findUnique({ where: { id: assembled.entryId }, include: { players: true } });
    expect(entry?.players).toHaveLength(5);
    const reused = await enrollExistingTeam(reuseTournamentId, assembled.teamId);
    expect(reused.teamId).toBe(assembled.teamId);
  });

  it("generates, advances, completes, and explicitly rolls back an elimination bracket", async () => {
    const team = await prisma.team.create({
      data: {
        id: `integration-team-${suffix}`,
        game: "valorant",
        name: "Integration Five",
        players: { create: Array.from({ length: 5 }, (_, index) => ({ fullName: `Team Player ${index}`, studentId: `INT-TEAM-${suffix}-${index}`, universityName: "Integration University", email: `team-${suffix}-${index}@example.edu`, isCaptain: index === 0 })) }
      }
    });
    createdTeamIds.push(team.id);
    await enrollExistingTeam(tournamentId, team.id);
    expect(await generateTournamentCompetition(tournamentId)).toEqual({ matches: 1 });
    const match = await prisma.match.findFirstOrThrow({ where: { tournamentId } });
    await recordMatchScore(match.id, 2, 1);
    expect((await prisma.tournament.findUniqueOrThrow({ where: { id: tournamentId } })).status).toBe("complete");
    await expect(generateTournamentCompetition(tournamentId)).rejects.toMatchObject({ status: 409 });
    await rollbackMatchResult(match.id);
    const rolledBack = await prisma.match.findUniqueOrThrow({ where: { id: match.id } });
    expect(rolledBack).toMatchObject({ status: "scheduled", winnerEntryId: null, teamAScore: 0, teamBScore: 0 });
    await recordMatchScore(match.id, 0, 2);
    expect((await prisma.tournament.findUniqueOrThrow({ where: { id: tournamentId } })).status).toBe("complete");
  });

  it("routes a full double-elimination bracket through a required reset final", async () => {
    for (let teamIndex = 0; teamIndex < 4; teamIndex += 1) {
      const team = await prisma.team.create({
        data: {
          id: `integration-double-team-${suffix}-${teamIndex}`,
          game: "cs2",
          name: `Double Team ${teamIndex + 1}`,
          players: { create: Array.from({ length: 5 }, (_, playerIndex) => ({ fullName: `Double ${teamIndex}-${playerIndex}`, studentId: `INT-DOUBLE-${suffix}-${teamIndex}-${playerIndex}`, universityName: "Integration University", email: `double-${suffix}-${teamIndex}-${playerIndex}@example.edu`, isCaptain: playerIndex === 0 })) }
        }
      });
      createdTeamIds.push(team.id);
      await enrollExistingTeam(doubleTournamentId, team.id);
    }
    await generateTournamentCompetition(doubleTournamentId);
    const getMatch = (bracket: "winners" | "losers" | "finals", round: number, position = 1) => prisma.match.findFirstOrThrow({ where: { tournamentId: doubleTournamentId, bracket, round, position } });
    await recordMatchScore((await getMatch("winners", 1, 1)).id, 2, 0);
    await recordMatchScore((await getMatch("winners", 1, 2)).id, 2, 1);
    await recordMatchScore((await getMatch("losers", 1)).id, 2, 0);
    await recordMatchScore((await getMatch("winners", 2)).id, 2, 1);
    const lowerFinal = await getMatch("losers", 2);
    expect(lowerFinal.teamAEntryId).toBeTruthy();
    expect(lowerFinal.teamBEntryId).toBeTruthy();
    await recordMatchScore(lowerFinal.id, 2, 1);
    const grandFinal = await getMatch("finals", 1);
    await recordMatchScore(grandFinal.id, 0, 2);
    const resetFinal = await getMatch("finals", 2);
    expect(resetFinal).toMatchObject({ status: "scheduled", isResetFinal: true, teamAEntryId: grandFinal.teamAEntryId, teamBEntryId: grandFinal.teamBEntryId });
    await recordMatchScore(resetFinal.id, 2, 1);
    expect((await prisma.tournament.findUniqueOrThrow({ where: { id: doubleTournamentId } })).status).toBe("complete");
  });

  it("generates Swiss rounds incrementally without immediate rematches", async () => {
    for (let teamIndex = 0; teamIndex < 4; teamIndex += 1) {
      const team = await prisma.team.create({
        data: {
          id: `integration-swiss-team-${suffix}-${teamIndex}`,
          game: "valorant",
          name: `Swiss Team ${teamIndex + 1}`,
          players: { create: Array.from({ length: 5 }, (_, playerIndex) => ({ fullName: `Swiss ${teamIndex}-${playerIndex}`, studentId: `INT-SWISS-${suffix}-${teamIndex}-${playerIndex}`, universityName: "Integration University", email: `swiss-${suffix}-${teamIndex}-${playerIndex}@example.edu`, isCaptain: playerIndex === 0 })) }
        }
      });
      createdTeamIds.push(team.id);
      await enrollExistingTeam(swissTournamentId, team.id);
    }
    await generateTournamentCompetition(swissTournamentId);
    const firstRound = await prisma.match.findMany({ where: { tournamentId: swissTournamentId, round: 1 } });
    const firstPairs = new Set(firstRound.map((match) => [match.teamAEntryId, match.teamBEntryId].sort().join(":")));
    for (const match of firstRound) await recordMatchScore(match.id, 2, 0);
    expect(await generateNextSwissRound(swissTournamentId)).toMatchObject({ round: 2, matches: 2 });
    const secondRound = await prisma.match.findMany({ where: { tournamentId: swissTournamentId, round: 2 } });
    expect(secondRound.every((match) => !firstPairs.has([match.teamAEntryId, match.teamBEntryId].sort().join(":")))).toBe(true);
  });
});
