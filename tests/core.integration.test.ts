import { afterAll, beforeAll, describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { assembleSoloTeam, enrollExistingTeam, reviewRegistration } from "@/lib/registrations/service";
import { generateNextSwissRound, generateTournamentCompetition, recordMatchScore, rollbackMatchResult } from "@/lib/tournaments/service";
import { generateNextTftStage, generateTftCompetition, recordTftGameResults } from "@/lib/tournaments/tft-service";
import { reviewStaffApplication, submitStaffApplication } from "@/lib/staff-accounts";

const runDatabaseTests = process.env.RUN_DB_TESTS === "1";

describe.skipIf(!runDatabaseTests).sequential("database-backed core workflow", () => {
  const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const tournamentId = `integration-main-${suffix}`;
  const reuseTournamentId = `integration-reuse-${suffix}`;
  const doubleTournamentId = `integration-double-${suffix}`;
  const swissTournamentId = `integration-swiss-${suffix}`;
  const tftTournamentIds = [8, 16, 32].map((size) => `integration-tft-${size}-${suffix}`);
  const registrationIds: string[] = [];
  const createdTeamIds: string[] = [];
  const createdUserIds: string[] = [];
  let adminUserId = "";

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash("integration-admin-password", 4);
    const admin = await prisma.user.create({ data: { email: `integration-admin-${suffix}@example.edu`, name: "Integration Admin", passwordHash, role: "admin", accountStatus: "approved" } });
    adminUserId = admin.id;
    createdUserIds.push(admin.id);
    await prisma.tournament.create({ data: { id: tournamentId, title: "Integration Cup", game: "valorant", format: "single_elimination", status: "registration", registrationOpen: true } });
    await prisma.tournament.create({ data: { id: reuseTournamentId, title: "Reuse Cup", game: "valorant", format: "round_robin", status: "draft" } });
    await prisma.tournament.create({ data: { id: doubleTournamentId, title: "Double Cup", game: "cs2", format: "double_elimination", status: "draft" } });
    await prisma.tournament.create({ data: { id: swissTournamentId, title: "Swiss Cup", game: "valorant", format: "swiss", status: "draft", swissRounds: 3 } });
    for (const [index, id] of tftTournamentIds.entries()) {
      await prisma.tournament.create({ data: { id, title: `TFT ${[8, 16, 32][index]} Cup`, game: "tft", format: "tft_lobby", status: "draft", tftFinalMode: "fixed_games" } });
    }
    for (let index = 0; index < 5; index += 1) {
      const registration = await prisma.registration.create({
        data: {
          tournamentId,
          game: "valorant",
          mode: "solo",
          status: "approved",
          members: { create: { fullName: `Solo ${index}`, inGameName: `solo${index}#TEST`, studentId: `INT-SOLO-${suffix}-${index}`, universityName: "Integration University", email: `solo-${suffix}-${index}@example.edu`, isCaptain: true } }
        }
      });
      registrationIds.push(registration.id);
    }
  });

  afterAll(async () => {
    await prisma.tournament.deleteMany({ where: { id: { in: [tournamentId, reuseTournamentId, doubleTournamentId, swissTournamentId, ...tftTournamentIds] } } });
    await prisma.team.deleteMany({ where: { id: { in: createdTeamIds } } });
    await prisma.staffAccountReview.deleteMany({ where: { OR: [{ userId: { in: createdUserIds } }, { reviewerUserId: { in: createdUserIds } }] } });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  });

  it("submits, rejects, resubmits, and approves a staff application while retaining review history", async () => {
    const email = `staff-applicant-${suffix}@example.edu`;
    const password = "integration-staff-password";
    const input = {
      name: "Integration Staff",
      email,
      studentId: `STAFF-${suffix}`.toUpperCase(),
      universityName: "Integration University",
      password,
      applicationReason: "I want to help operate integration test tournaments."
    };
    const application = await submitStaffApplication(input);
    createdUserIds.push(application.id);
    const pending = await prisma.user.findUniqueOrThrow({ where: { id: application.id } });
    expect(pending.accountStatus).toBe("pending");
    expect(pending.passwordHash).not.toBe(password);
    expect(await bcrypt.compare(password, pending.passwordHash)).toBe(true);

    await reviewStaffApplication({ userId: application.id, reviewerUserId: adminUserId, action: "rejected", note: "Please add more context." });
    await expect(submitStaffApplication({ ...input, password: "incorrect-password" })).rejects.toMatchObject({ status: 401 });
    await submitStaffApplication({ ...input, applicationReason: "I added more context and still want to help operate events." });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: application.id } })).accountStatus).toBe("pending");
    expect(await prisma.staffAccountReview.count({ where: { userId: application.id } })).toBe(1);

    await reviewStaffApplication({ userId: application.id, reviewerUserId: adminUserId, action: "approved", note: "Approved for operations." });
    expect((await prisma.user.findUniqueOrThrow({ where: { id: application.id } })).accountStatus).toBe("approved");
    expect(await prisma.staffAccountReview.count({ where: { userId: application.id } })).toBe(2);
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
        players: { create: Array.from({ length: 5 }, (_, index) => ({ fullName: `Team Player ${index}`, inGameName: `team${index}#TEST`, studentId: `INT-TEAM-${suffix}-${index}`, universityName: "Integration University", email: `team-${suffix}-${index}@example.edu`, isCaptain: index === 0 })) }
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
          players: { create: Array.from({ length: 5 }, (_, playerIndex) => ({ fullName: `Double ${teamIndex}-${playerIndex}`, inGameName: `double${teamIndex}${playerIndex}#TEST`, studentId: `INT-DOUBLE-${suffix}-${teamIndex}-${playerIndex}`, universityName: "Integration University", email: `double-${suffix}-${teamIndex}-${playerIndex}@example.edu`, isCaptain: playerIndex === 0 })) }
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
          players: { create: Array.from({ length: 5 }, (_, playerIndex) => ({ fullName: `Swiss ${teamIndex}-${playerIndex}`, inGameName: `swiss${teamIndex}${playerIndex}#TEST`, studentId: `INT-SWISS-${suffix}-${teamIndex}-${playerIndex}`, universityName: "Integration University", email: `swiss-${suffix}-${teamIndex}-${playerIndex}@example.edu`, isCaptain: playerIndex === 0 })) }
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

  it("runs complete 8, 16, and 32-player TFT staged competitions", async () => {
    for (const [fieldIndex, fieldSize] of [8, 16, 32].entries()) {
      const tftTournamentId = tftTournamentIds[fieldIndex];
      let firstPlayerIndex = 0;
      if (fieldSize === 8) {
        const registration = await prisma.registration.create({
          data: {
            tournamentId: tftTournamentId,
            game: "tft",
            mode: "solo",
            members: { create: { fullName: "Registered Tactician", inGameName: "registered#TFT", studentId: `INT-TFT-REG-${suffix}`, universityName: "Integration University", email: `tft-registered-${suffix}@example.edu`, isCaptain: true } }
          }
        });
        const approved = await reviewRegistration({ registrationId: registration.id, action: "approve_new" });
        expect(approved.resolvedTeamId).toBeTruthy();
        createdTeamIds.push(approved.resolvedTeamId!);
        expect(await prisma.tournamentEntry.count({ where: { tournamentId: tftTournamentId } })).toBe(1);
        firstPlayerIndex = 1;
      }
      for (let playerIndex = firstPlayerIndex; playerIndex < fieldSize; playerIndex += 1) {
        const team = await prisma.team.create({
          data: {
            id: `integration-tft-team-${fieldSize}-${suffix}-${playerIndex}`,
            game: "tft",
            name: `Tactician ${fieldSize}-${playerIndex + 1}`,
            players: { create: { fullName: `Tactician ${playerIndex + 1}`, inGameName: `tft${fieldSize}${playerIndex}#TEST`, studentId: `INT-TFT-${fieldSize}-${suffix}-${playerIndex}`, universityName: "Integration University", email: `tft-${fieldSize}-${suffix}-${playerIndex}@example.edu`, isCaptain: true } }
          }
        });
        createdTeamIds.push(team.id);
        await enrollExistingTeam(tftTournamentId, team.id);
      }
      await generateTftCompetition(tftTournamentId);

      while (true) {
        const stage = await prisma.tftStage.findFirstOrThrow({
          where: { tournamentId: tftTournamentId },
          orderBy: { sequence: "desc" },
          include: { lobbies: { include: { entries: { orderBy: { stageSeed: "asc" } }, games: { orderBy: { number: "asc" } } } } }
        });
        for (const lobby of stage.lobbies) {
          for (const game of lobby.games) {
            await recordTftGameResults(game.id, lobby.entries.map((seat, index) => ({ entryId: seat.entryId, placement: index + 1 })));
          }
        }
        const completed = await prisma.tftStage.findUniqueOrThrow({ where: { id: stage.id } });
        expect(completed.status).toBe("complete");
        if (stage.isFinal) break;
        await generateNextTftStage(tftTournamentId);
      }

      const tournament = await prisma.tournament.findUniqueOrThrow({ where: { id: tftTournamentId } });
      expect(tournament.status).toBe("complete");
      expect(await prisma.tftStage.count({ where: { tournamentId: tftTournamentId } })).toBe(Math.log2(fieldSize / 8) + 1);
    }
  }, 60_000);
});
