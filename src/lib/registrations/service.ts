import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { gameConfigs, getTournamentRosterRules } from "@/lib/game-config";

export class RegistrationOperationError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

type Tx = Prisma.TransactionClient;

async function assertTournamentEditable(tx: Tx, tournamentId: string) {
  const tournament = await tx.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) throw new RegistrationOperationError("Tournament not found.", 404);
  if (!["draft", "registration"].includes(tournament.status) || tournament.lockBracketAt) {
    throw new RegistrationOperationError("Entrants cannot be changed after the bracket is locked.", 409);
  }
  return tournament;
}

async function assertRosterAvailable(
  tx: Tx,
  tournamentId: string,
  players: Array<{ studentId: string; email: string | null }>,
  excludedEntryId?: string
) {
  const conflict = await tx.tournamentEntryPlayer.findFirst({
    where: {
      entry: { tournamentId, ...(excludedEntryId ? { id: { not: excludedEntryId } } : {}) },
      OR: [
        { studentId: { in: players.map((player) => player.studentId) } },
        { email: { in: players.flatMap((player) => player.email ? [player.email.toLowerCase()] : []) } }
      ]
    }
  });
  if (conflict) throw new RegistrationOperationError("A player on this roster is already enrolled in the tournament.", 409);
}

async function createEntrySnapshot(tx: Tx, tournamentId: string, teamId: string) {
  const tournament = await assertTournamentEditable(tx, tournamentId);
  const team = await tx.team.findUnique({ where: { id: teamId }, include: { players: true } });
  if (!team) throw new RegistrationOperationError("Team not found.", 404);
  if (team.game !== tournament.game) throw new RegistrationOperationError("The team game does not match the tournament.");
  const rules = getTournamentRosterRules(tournament.game, tournament.participationFormat);
  const mainRosterSize = rules.mainRosterSize;
  const maxRosterSize = mainRosterSize + rules.maxReservePlayers;
  const mainPlayers = team.players.filter((player) => !player.isReserve);
  if (team.players.length < mainRosterSize || team.players.length > maxRosterSize || mainPlayers.length !== mainRosterSize) {
    throw new RegistrationOperationError(`The team must have ${mainRosterSize} main players and no more than ${rules.maxReservePlayers} reserves.`);
  }
  await assertRosterAvailable(tx, tournamentId, team.players);
  const highestSeed = await tx.tournamentEntry.aggregate({ where: { tournamentId }, _max: { seed: true } });
  return tx.tournamentEntry.create({
    data: {
      tournamentId,
      teamId,
      displayName: team.name,
      seed: (highestSeed._max.seed ?? 0) + 1,
      players: {
        create: team.players.map((player) => ({
          playerId: player.id,
          fullName: player.fullName,
          inGameName: player.inGameName,
          studentId: player.studentId,
          universityName: player.universityName,
          email: player.email?.toLowerCase(),
          discord: player.discord,
          isCaptain: player.isCaptain,
          isReserve: player.isReserve
        }))
      }
    }
  });
}

export async function reviewRegistration(input: {
  registrationId: string;
  action: "reject" | "approve_new" | "approve_link";
  teamId?: string;
  reviewNote?: string;
}) {
  return prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({
      where: { id: input.registrationId },
      include: { members: { orderBy: [{ isCaptain: "desc" }, { isReserve: "asc" }, { createdAt: "asc" }] }, tournament: true }
    });
    if (!registration) throw new RegistrationOperationError("Registration not found.", 404);
    await assertTournamentEditable(tx, registration.tournamentId);
    if (input.action === "reject") {
      if (registration.resolvedTeamId) throw new RegistrationOperationError("An enrolled registration must be removed from the event before rejection.", 409);
      return tx.registration.update({
        where: { id: registration.id },
        data: { status: "rejected", reviewNote: input.reviewNote?.trim() || null, reviewedAt: new Date() }
      });
    }
    if (registration.mode === "solo" && registration.tournament.participationFormat !== "five_v_five") {
      const member = registration.members[0];
      if (!member || registration.members.length !== 1) throw new RegistrationOperationError("Individual registration must contain one player.", 409);
      const team = await tx.team.create({
        data: {
          game: registration.game,
          name: member.inGameName,
          players: {
            create: {
              fullName: member.fullName,
              inGameName: member.inGameName,
              studentId: member.studentId,
              universityName: member.universityName,
              email: member.email,
              discord: member.discord,
              isCaptain: true,
              isReserve: false
            }
          }
        }
      });
      await createEntrySnapshot(tx, registration.tournamentId, team.id);
      return tx.registration.update({
        where: { id: registration.id },
        data: { status: "approved", resolvedTeamId: team.id, reviewNote: input.reviewNote?.trim() || null, reviewedAt: new Date() }
      });
    }
    if (registration.mode === "solo") {
      return tx.registration.update({
        where: { id: registration.id },
        data: { status: "approved", reviewNote: input.reviewNote?.trim() || null, reviewedAt: new Date() }
      });
    }

    let teamId = input.teamId;
    if (input.action === "approve_link") {
      if (!teamId) throw new RegistrationOperationError("Select an existing team to link.");
    } else {
      const team = await tx.team.create({
        data: {
          game: registration.game,
          name: registration.teamName ?? "Unnamed team",
          players: {
            create: registration.members.map((member) => ({
              fullName: member.fullName,
              inGameName: member.inGameName,
              studentId: member.studentId,
              universityName: member.universityName,
              email: member.email,
              discord: member.discord,
              isCaptain: member.isCaptain,
              isReserve: member.isReserve
            }))
          }
        }
      });
      teamId = team.id;
    }
    if (!teamId) throw new RegistrationOperationError("Team could not be resolved.", 500);
    await createEntrySnapshot(tx, registration.tournamentId, teamId);
    return tx.registration.update({
      where: { id: registration.id },
      data: {
        status: "approved",
        resolvedTeamId: teamId,
        reviewNote: input.reviewNote?.trim() || null,
        reviewedAt: new Date()
      }
    });
  });
}

export async function assembleSoloTeam(input: { tournamentId: string; registrationIds: string[]; teamName: string }) {
  return prisma.$transaction(async (tx) => {
    const tournament = await assertTournamentEditable(tx, input.tournamentId);
    if (tournament.participationFormat !== "five_v_five") throw new RegistrationOperationError("Solo-team assembly is only available for 5v5 tournaments.", 409);
    const size = gameConfigs[tournament.game].teamSize;
    if (input.registrationIds.length !== size || new Set(input.registrationIds).size !== size) {
      throw new RegistrationOperationError(`Select exactly ${size} unique solo players.`);
    }
    if (input.teamName.trim().length < 2) throw new RegistrationOperationError("Team name is required.");
    const registrations = await tx.registration.findMany({
      where: { id: { in: input.registrationIds } },
      include: { members: true }
    });
    if (
      registrations.length !== size ||
      registrations.some((item) => item.tournamentId !== input.tournamentId || item.game !== tournament.game || item.mode !== "solo" || item.status !== "approved" || item.resolvedTeamId || item.members.length !== 1)
    ) {
      throw new RegistrationOperationError("Every selected player must be an approved, unresolved solo registration for this tournament.", 409);
    }
    const members = registrations.map((item) => item.members[0]);
    await assertRosterAvailable(tx, input.tournamentId, members);
    const team = await tx.team.create({
      data: {
        game: tournament.game,
        name: input.teamName.trim(),
        players: {
          create: members.map((member, index) => ({
            fullName: member.fullName,
            inGameName: member.inGameName,
            studentId: member.studentId,
            universityName: member.universityName,
            email: member.email,
            discord: member.discord,
            isCaptain: index === 0,
            isReserve: false
          }))
        }
      }
    });
    await tx.registration.updateMany({
      where: { id: { in: input.registrationIds } },
      data: { resolvedTeamId: team.id, reviewedAt: new Date() }
    });
    const entry = await createEntrySnapshot(tx, input.tournamentId, team.id);
    return { teamId: team.id, entryId: entry.id };
  });
}

export async function enrollExistingTeam(tournamentId: string, teamId: string) {
  return prisma.$transaction((tx) => createEntrySnapshot(tx, tournamentId, teamId));
}

export async function updateEntrySeed(tournamentId: string, entryId: string, seed: number) {
  return prisma.$transaction(async (tx) => {
    await assertTournamentEditable(tx, tournamentId);
    if (!Number.isInteger(seed) || seed < 1) throw new RegistrationOperationError("Seed must be a positive integer.");
    const duplicate = await tx.tournamentEntry.findFirst({ where: { tournamentId, seed, id: { not: entryId } } });
    if (duplicate) throw new RegistrationOperationError("Each tournament seed must be unique.", 409);
    return tx.tournamentEntry.update({ where: { id: entryId }, data: { seed } });
  });
}

export async function removeTournamentEntry(tournamentId: string, entryId: string) {
  return prisma.$transaction(async (tx) => {
    await assertTournamentEditable(tx, tournamentId);
    const entry = await tx.tournamentEntry.findFirst({ where: { id: entryId, tournamentId } });
    if (!entry) throw new RegistrationOperationError("Tournament entry not found.", 404);
    await tx.registration.updateMany({ where: { tournamentId, resolvedTeamId: entry.teamId }, data: { resolvedTeamId: null } });
    return tx.tournamentEntry.delete({ where: { id: entryId } });
  });
}
